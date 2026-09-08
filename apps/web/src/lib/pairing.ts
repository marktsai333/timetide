import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteField,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";

export interface MeetingData {
  startAt: string;
  endAt: string;
  title?: string;
  notes?: string;
  proposedByUid: string;
  status: "proposed" | "confirmed" | "declined" | "cancelled";
  cancelledByUid?: string;
  createdAt: string;
}

export interface MeetingWithId extends MeetingData {
  id: string;
}

export interface PairingData {
  memberUids: string[];
}

const INVITE_TTL_MINUTES = 15;
const INVITE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateInviteCode(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => INVITE_ALPHABET[b % INVITE_ALPHABET.length]).join("");
}

export async function createInvite(uid: string) {
  const pairingRef = doc(collection(db, "pairings"));
  await setDoc(pairingRef, { memberUids: [uid], createdAt: serverTimestamp() });

  const inviteCode = generateInviteCode();
  const expiresAt = new Date(Date.now() + INVITE_TTL_MINUTES * 60_000).toISOString();
  await setDoc(doc(db, "invites", inviteCode), {
    pairingId: pairingRef.id,
    creatorUid: uid,
    expiresAt,
    redeemed: false,
  });

  return { pairingId: pairingRef.id, inviteCode, expiresAt };
}

export async function redeemInvite(uid: string, inviteCode: string) {
  const inviteRef = doc(db, "invites", inviteCode);
  const inviteSnap = await getDoc(inviteRef);
  if (!inviteSnap.exists()) throw new Error("邀請碼不存在");
  const invite = inviteSnap.data();
  if (invite.redeemed) throw new Error("邀請碼已被使用");
  if (new Date(invite.expiresAt) < new Date()) throw new Error("邀請碼已過期");
  if (invite.creatorUid === uid) throw new Error("不能兌換自己的邀請碼");

  const pairingRef = doc(db, "pairings", invite.pairingId);
  await runTransaction(db, async (tx) => {
    const pairingSnap = await tx.get(pairingRef);
    if (!pairingSnap.exists()) throw new Error("配對不存在");
    const memberUids: string[] = pairingSnap.data().memberUids ?? [];
    if (memberUids.length >= 2 && !memberUids.includes(uid)) {
      throw new Error("這組配對已經滿了");
    }
    tx.update(pairingRef, { memberUids: arrayUnion(uid) });
    tx.set(doc(db, "users", uid), { pairingId: invite.pairingId }, { merge: true });
    tx.update(inviteRef, { redeemed: true });
  });

  return { pairingId: invite.pairingId as string };
}

export async function leavePairing(pairingId: string, uid: string) {
  await updateDoc(doc(db, "pairings", pairingId), { memberUids: arrayRemove(uid) });
  await updateDoc(doc(db, "users", uid), { pairingId: deleteField() }).catch(() => {
    // users/{uid} may not exist yet -- leaving is still valid even if this is a no-op.
  });
}

export function subscribeToPairing(pairingId: string, cb: (data: PairingData | null) => void) {
  return onSnapshot(doc(db, "pairings", pairingId), (snap) => {
    if (!snap.exists()) {
      cb(null);
      return;
    }
    const data = snap.data();
    cb({ memberUids: data.memberUids ?? [] });
  });
}

export async function createMeeting(
  pairingId: string,
  uid: string,
  meeting: { startAt: string; endAt: string; title?: string; notes?: string },
) {
  const data: MeetingData = {
    ...meeting,
    proposedByUid: uid,
    status: "proposed",
    createdAt: new Date().toISOString(),
  };
  await addDoc(collection(db, "pairings", pairingId, "meetings"), data);
}

export async function respondToMeetingDoc(pairingId: string, meetingId: string, status: "confirmed" | "declined") {
  await updateDoc(doc(db, "pairings", pairingId, "meetings", meetingId), { status });
}

export async function cancelMeetingDoc(pairingId: string, meetingId: string, uid: string) {
  await updateDoc(doc(db, "pairings", pairingId, "meetings", meetingId), {
    status: "cancelled",
    cancelledByUid: uid,
  });
}

export function subscribeToMeetings(pairingId: string, cb: (meetings: MeetingWithId[]) => void) {
  const meetingsQuery = query(collection(db, "pairings", pairingId, "meetings"), orderBy("startAt"));
  return onSnapshot(meetingsQuery, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as MeetingData) })));
  });
}
