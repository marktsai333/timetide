import { isWithinNightRange } from "../../lib/timezone";

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, hour) => hour);

function formatHourLabel(hour: number): string {
  const period = hour < 12 ? "上午" : "下午";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${period} ${displayHour} 點`;
}

export function NightHoursEditor({
  nightStartHour,
  nightEndHour,
  onChange,
}: {
  nightStartHour: number;
  nightEndHour: number;
  onChange: (nightStartHour: number, nightEndHour: number) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <label className="flex flex-col gap-1" style={{ fontSize: 13, color: "var(--text-muted)" }}>
          從
          <select
            value={nightStartHour}
            onChange={(e) => onChange(Number(e.target.value), nightEndHour)}
            className="rounded-lg px-2 py-1.5"
            style={{ background: "var(--glass-bg-strong)", border: "1px solid var(--glass-border)", color: "var(--text)" }}
          >
            {HOUR_OPTIONS.map((hour) => (
              <option key={hour} value={hour}>
                {formatHourLabel(hour)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1" style={{ fontSize: 13, color: "var(--text-muted)" }}>
          到
          <select
            value={nightEndHour}
            onChange={(e) => onChange(nightStartHour, Number(e.target.value))}
            className="rounded-lg px-2 py-1.5"
            style={{ background: "var(--glass-bg-strong)", border: "1px solid var(--glass-border)", color: "var(--text)" }}
          >
            {HOUR_OPTIONS.map((hour) => (
              <option key={hour} value={hour}>
                {formatHourLabel(hour)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div>
        <div className="flex gap-[2px]">
          {HOUR_OPTIONS.map((hour) => {
            const isNight = isWithinNightRange(hour, nightStartHour, nightEndHour);
            return (
              <div
                key={hour}
                className="flex-1"
                style={{
                  height: 24,
                  borderRadius: 3,
                  background: isNight ? "var(--rail-self-soft)" : "var(--rail-self)",
                  opacity: isNight ? 0.65 : 1,
                }}
              />
            );
          })}
        </div>
        <div className="flex justify-between mt-1" style={{ fontSize: 10, color: "var(--text-muted)" }}>
          <span>0 點</span>
          <span>12 點</span>
          <span>23 點</span>
        </div>
      </div>

      <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>
        設定範圍內的時段，在時間軸上會稍微變暗，代表那個時間點通常是「夜晚」。這只是視覺提示，不會影響任何功能，你可以設成兩人實際上睡覺的時段。
      </p>
    </div>
  );
}
