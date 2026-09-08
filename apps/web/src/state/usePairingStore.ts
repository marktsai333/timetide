import { create } from "zustand";
import { getUid } from "../lib/firebase";
import { loadPairingId, savePairingId } from "../lib/db";
import {
  createInvite,
  proposeMeeting as proposeMeetingApi,
  redeemInvite,
  respondToMeeting as respondToMeetingApi,
  subscribeToPairing,
  type MeetingData,
} from "../lib/pairing";

interface PairingState {
  pairingId: string | null;
  memberUids: string[];
  meeting: MeetingData | null;
  status: "idle" | "loading" | "paired" | "error";
  error: string | null;
  hydrate: () => Promise<void>;
  createInviteCode: () => Promise<{ inviteCode: string; expiresAt: string }>;
  redeemInviteCode: (code: string) => Promise<void>;
  proposeMeeting: (meeting: { startAt: string; endAt: string; title?: string; notes?: string }) => Promise<void>;
  respondToMeeting: (status: "confirmed" | "declined") => Promise<void>;
}

let unsubscribe: (() => void) | null = null;

export const usePairingStore = create<PairingState>((set, get) => {
  function subscribe(pairingId: string) {
    unsubscribe?.();
    unsubscribe = subscribeToPairing(pairingId, (data) => {
      set({ memberUids: data?.memberUids ?? [], meeting: data?.meeting ?? null });
    });
  }

  return {
    pairingId: null,
    memberUids: [],
    meeting: null,
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
    async proposeMeeting(meeting) {
      const { pairingId } = get();
      if (!pairingId) return;
      const uid = await getUid();
      await proposeMeetingApi(pairingId, uid, meeting);
    },
    async respondToMeeting(status) {
      const { pairingId } = get();
      if (!pairingId) return;
      await respondToMeetingApi(pairingId, status);
    },
  };
});
