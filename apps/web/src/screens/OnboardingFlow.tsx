import { useState } from "react";
import type { TimezoneCity } from "../lib/timezone-cities";
import { guessDeviceCity } from "../lib/timezone-cities";
import { TimezonePicker } from "../components/timeline/TimezonePicker";
import { NightHoursEditor } from "../components/timeline/NightHoursEditor";
import { useTimelineStore } from "../state/useTimelineStore";
import { DEFAULT_NIGHT_START_HOUR, DEFAULT_NIGHT_END_HOUR } from "../lib/timezone";

export function OnboardingFlow() {
  const setSelf = useTimelineStore((s) => s.setSelf);
  const setPartner = useTimelineStore((s) => s.setPartner);
  const setNightHours = useTimelineStore((s) => s.setNightHours);
  const [step, setStep] = useState<"self" | "partner" | "night">("self");
  const [pickerOpen, setPickerOpen] = useState(true);
  const [selfCity, setSelfCity] = useState<TimezoneCity | null>(null);
  const [partnerCity, setPartnerCity] = useState<TimezoneCity | null>(null);
  const [nightStartHour, setNightStartHour] = useState(DEFAULT_NIGHT_START_HOUR);
  const [nightEndHour, setNightEndHour] = useState(DEFAULT_NIGHT_END_HOUR);

  function handleCityPick(city: TimezoneCity) {
    if (step === "self") {
      setSelfCity(city);
      setSelf({ ianaTimezone: city.ianaTimezone, label: city.label, colorHex: undefined });
      setStep("partner");
      setPickerOpen(true);
    } else if (step === "partner") {
      setPartnerCity(city);
      setStep("night");
      setPickerOpen(false);
    }
  }

  function handleFinish() {
    if (!partnerCity) return;
    setPartner({ ianaTimezone: partnerCity.ianaTimezone, label: partnerCity.label, colorHex: undefined });
    setNightHours(nightStartHour, nightEndHour);
  }

  if (step === "night") {
    return (
      <div className="h-full flex flex-col px-6 pt-12 pb-8 gap-5" style={{ paddingBottom: "calc(24px + env(safe-area-inset-bottom))" }}>
        <div className="text-center">
          <span style={{ fontSize: 32 }}>🌙</span>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginTop: 8 }}>設定夜晚時段</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
            {selfCity?.label} 跟 {partnerCity?.label} 都會用這個時段判斷「當地現在是不是晚上」
          </p>
        </div>
        <NightHoursEditor
          nightStartHour={nightStartHour}
          nightEndHour={nightEndHour}
          onChange={(start, end) => {
            setNightStartHour(start);
            setNightEndHour(end);
          }}
        />
        <button
          onClick={handleFinish}
          className="rounded-full px-5 py-3 mt-auto"
          style={{ background: "var(--rail-self)", color: "#031018", fontWeight: 700, fontSize: 16 }}
        >
          完成
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center px-8 text-center gap-3">
      <span style={{ fontSize: 40 }}>🌊</span>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>歡迎使用 TimeTide</h1>
      <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
        {step === "self" ? "先選你自己所在的城市" : `你在 ${selfCity?.label ?? ""}，那對方在哪裡？`}
      </p>
      <button
        onClick={() => setPickerOpen(true)}
        className="rounded-full px-5 py-2.5 mt-2"
        style={{ background: "var(--rail-self)", color: "#031018", fontWeight: 700 }}
      >
        {step === "self" ? "選擇我的城市" : "選擇對方的城市"}
      </button>
      <TimezonePicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        title={step === "self" ? "我在哪裡？" : "對方在哪裡？"}
        onSelect={handleCityPick}
      />
      <button
        onClick={() => {
          const guess = guessDeviceCity();
          handleCityPick(guess);
        }}
        style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "underline" }}
      >
        使用裝置目前所在時區
      </button>
    </div>
  );
}
