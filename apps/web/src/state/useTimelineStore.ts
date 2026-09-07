import { create } from "zustand";
import type { TimezoneProfile } from "@timetide/shared";
import { loadTimezoneSettings, saveTimezoneSettings } from "../lib/db";

interface TimelineState {
  self: TimezoneProfile | null;
  partner: TimezoneProfile | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setSelf: (profile: TimezoneProfile) => void;
  setPartner: (profile: TimezoneProfile) => void;
}

export const useTimelineStore = create<TimelineState>((set, get) => ({
  self: null,
  partner: null,
  hydrated: false,
  async hydrate() {
    const settings = await loadTimezoneSettings();
    set({ self: settings.self, partner: settings.partner, hydrated: true });
  },
  setSelf(profile) {
    set({ self: profile });
    void saveTimezoneSettings(profile, get().partner);
  },
  setPartner(profile) {
    set({ partner: profile });
    void saveTimezoneSettings(get().self, profile);
  },
}));
