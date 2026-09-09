import { create } from "zustand";
import { getUid } from "../lib/firebase";
import { clearPairingId, loadPairingId, savePairingId } from "../lib/db";
import { sendPushNotification } from "../lib/push";
import {
  cancelMeetingDoc,
  createInvite,
  createMeeting as createMeetingApi,
  leavePairing as leavePairingApi,
  redeemInvite,
  respondToMeetingDoc,
  subscribeToMeetings,
  subscribeToPairing,
  type MeetingWithId,
} from "../lib/pairing";

interface PairingState {
  pairingId: string | null;
  memberUids: string[];
  meetings: MeetingWithId[];
  status: "idle" | "loading" | "paired" | "error";
  error: string | null;
  hydrate: () => Promise<void>;
  createInviteCode: () => Promise<{ inviteCode: string; expiresAt: string }>;
  redeemInviteCode: (code: string) => Promise<void>;
  createMeeting: (meeting: {
    startAt: string;
    endAt: string;
    title?: string;
    notes?: string;
    reminderMinutesBefore?: number;
  }) => Promise<void>;
  respondToMeeting: (meetingId: string, status: "confirmed" | "declined") => Promise<void>;
  deleteMeeting: (meetingId: string) => Promise<void>;
  leavePairing: () => Promise<void>;
}

let unsubscribePairing: (() => void) | null = null;
let unsubscribeMeetings: (() => void) | null = null;

export const usePairingStore = create<PairingState>((set, get) => {
  function subscribe(pairingId: string) {
    unsubscribePairing?.();
    unsubscribeMeetings?.();
    unsubscribePairing = subscribeToPairing(pairingId, (data) => {
      set({ memberUids: data?.memberUids ?? [] });
    });
    unsubscribeMeetings = subscribeToMeetings(pairingId, (meetings) => {
      set({ meetings });
    });
  }

  return {
    pairingId: null,
    memberUids: [],
    meetings: [],
    status: "idle",
    error: null,
    async hydrate() {
      const pairingId = await loadPairingId();
      if (pairingId) {
        subscribe(pairingId);
        set({ pairingId, status: "paired" });
      }
    },
    async createInviteCode() {
      set({ status: "loading", error: null });
      try {
        const uid = await getUid();
        const { pairingId, inviteCode, expiresAt } = await createInvite(uid);
        await savePairingId(pairingId);
        subscribe(pairingId);
        set({ pairingId, status: "paired" });
        return { inviteCode, expiresAt };
      } catch (e) {
        set({ status: "error", error: (e as Error).message });
        throw e;
      }
    },
    async redeemInviteCode(code) {
      set({ status: "loading", error: null });
      try {
        const uid = await getUid();
        const { pairingId } = await redeemInvite(uid, code);
        await savePairingId(pairingId);
        subscribe(pairingId);
        set({ pairingId, status: "paired" });
      } catch (e) {
        set({ status: "error", error: (e as Error).message });
        throw e;
      }
    },
    async createMeeting(meeting) {
      const { pairingId, memberUids } = get();
      if (!pairingId) return;
      const uid = await getUid();
      await createMeetingApi(pairingId, uid, meeting);
      const recipientUid = memberUids.find((m) => m !== uid);
      if (recipientUid) {
        void sendPushNotification({
          recipientUid,
          title: "新的行程邀請",
          body: meeting.title || "打電話",
        });
      }
    },
    async respondToMeeting(meetingId, status) {
      const { pairingId, memberUids } = get();
      if (!pairingId) return;
      const uid = await getUid();
      await respondToMeetingDoc(pairingId, meetingId, status);
      const recipientUid = memberUids.find((m) => m !== uid);
      if (recipientUid) {
        void sendPushNotification({
          recipientUid,
          title: status === "confirmed" ? "行程已確認" : "行程被婉拒",
          body: "點開 TimeTide 查看",
        });
      }
    },
    async deleteMeeting(meetingId) {
      const { pairingId, memberUids } = get();
      if (!pairingId) return;
      const uid = await getUid();
      await cancelMeetingDoc(pairingId, meetingId, uid);
      const recipientUid = memberUids.find((m) => m !== uid);
      if (recipientUid) {
        void sendPushNotification({
          recipientUid,
          title: "對方刪除了一筆行程",
          body: "點開 TimeTide 查看",
        });
      }
    },
    async leavePairing() {
      const { pairingId } = get();
      if (!pairingId) return;
      const uid = await getUid();
      try {
        await leavePairingApi(pairingId, uid);
      } finally {
        unsubscribePairing?.();
        unsubscribeMeetings?.();
        unsubscribePairing = null;
        unsubscribeMeetings = null;
        await clearPairingId();
        set({ pairingId: null, memberUids: [], meetings: [], status: "idle", error: null });
      }
    },
  };
});
