import { useState } from "react";
import type { TimezoneCity } from "../lib/timezone-cities";
import { guessDeviceCity } from "../lib/timezone-cities";
import { TimezonePicker } from "../components/timeline/TimezonePicker";
import { useTimelineStore } from "../state/useTimelineStore";

export function OnboardingFlow() {
  const setSelf = useTimelineStore((s) => s.setSelf);
  const setPartner = useTimelineStore((s) => s.setPartner);
  const [step, setStep] = useState<"self" | "partner">("self");
  const [pickerOpen, setPickerOpen] = useState(true);
  const [selfCity, setSelfCity] = useState<TimezoneCity | null>(null);

  function handleSelect(city: TimezoneCity) {
    if (step === "self") {
      setSelfCity(city);
      setSelf({ ianaTimezone: city.ianaTimezone, label: city.label, colorHex: undefined });
      setStep("partner");
      setPickerOpen(true);
    } else {
      setPartner({ ianaTimezone: city.ianaTimezone, label: city.label, colorHex: undefined });
    }
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
        onSelect={handleSelect}
      />
      <button
        onClick={() => {
          const guess = guessDeviceCity();
          handleSelect(guess);
        }}
        style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "underline" }}
      >
        使用裝置目前所在時區
      </button>
    </div>
  );
}
