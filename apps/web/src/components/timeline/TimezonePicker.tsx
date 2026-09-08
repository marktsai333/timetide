import { Sheet } from "../Sheet";
import { TIMEZONE_CITIES, type TimezoneCity } from "../../lib/timezone-cities";

export function TimezonePicker({
  open,
  onOpenChange,
  title,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  onSelect: (city: TimezoneCity) => void;
}) {
  const regions = [...new Set(TIMEZONE_CITIES.map((city) => city.region))];

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={title}>
      <div className="flex flex-col gap-4">
        {regions.map((region) => (
          <div key={region}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }} className="mb-1.5">
              {region}
            </div>
            <div className="flex flex-col">
              {TIMEZONE_CITIES.filter((city) => city.region === region).map((city) => (
                <button
                  key={city.label}
                  onClick={() => {
                    onSelect(city);
                    onOpenChange(false);
                  }}
                  className="text-left py-2.5"
                  style={{ fontSize: 16, borderBottom: "1px solid var(--glass-border)" }}
                >
                  {city.label}
                  <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 8 }}>{city.ianaTimezone}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Sheet>
  );
}
