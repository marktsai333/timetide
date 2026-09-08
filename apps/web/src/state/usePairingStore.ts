import { create } from "zustand";
import { getUid } from "../lib/firebase";
import { loadPairingId, savePairingId } from "../lib/db";
import {
  createInvite,
  createMeeting as createMeetingApi,
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
  createMeeting: (meeting: { startAt: string; endAt: string; title?: string; notes?: string }) => Promise<void>;
  respondToMeeting: (meetingId: string, status: "confirmed" | "declined") => Promise<void>;
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
      const { pairingId } = get();
      if (!pairingId) return;
      const uid = await getUid();
      await createMeetingApi(pairingId, uid, meeting);
    },
    async respondToMeeting(meetingId, status) {
      const { pairingId } = get();
      if (!pairingId) return;
      await respondToMeetingDoc(pairingId, meetingId, status);
    },
  };
});
