import { create } from "zustand";
import type { TimezoneProfile } from "@timetide/shared";
import { loadTimezoneSettings, saveTimezoneSettings } from "../lib/db";
import { DEFAULT_NIGHT_START_HOUR, DEFAULT_NIGHT_END_HOUR } from "../lib/timezone";

interface TimelineState {
  self: TimezoneProfile | null;
  partner: TimezoneProfile | null;
  nightStartHour: number;
  nightEndHour: number;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setSelf: (profile: TimezoneProfile) => void;
  setPartner: (profile: TimezoneProfile) => void;
  setNightHours: (nightStartHour: number, nightEndHour: number) => void;
}

export const useTimelineStore = create<TimelineState>((set, get) => ({
  self: null,
  partner: null,
  nightStartHour: DEFAULT_NIGHT_START_HOUR,
  nightEndHour: DEFAULT_NIGHT_END_HOUR,
  hydrated: false,
  async hydrate() {
    const settings = await loadTimezoneSettings();
    set({
      self: settings.self,
      partner: settings.partner,
      nightStartHour: settings.nightStartHour,
      nightEndHour: settings.nightEndHour,
      hydrated: true,
    });
  },
  setSelf(profile) {
    set({ self: profile });
    const { partner, nightStartHour, nightEndHour } = get();
    void saveTimezoneSettings({ self: profile, partner, nightStartHour, nightEndHour });
  },
  setPartner(profile) {
    set({ partner: profile });
    const { self, nightStartHour, nightEndHour } = get();
    void saveTimezoneSettings({ self, partner: profile, nightStartHour, nightEndHour });
  },
  setNightHours(nightStartHour, nightEndHour) {
    set({ nightStartHour, nightEndHour });
    const { self, partner } = get();
    void saveTimezoneSettings({ self, partner, nightStartHour, nightEndHour });
  },
}));
