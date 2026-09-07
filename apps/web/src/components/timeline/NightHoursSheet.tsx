import { Sheet } from "../Sheet";
import { NightHoursEditor } from "./NightHoursEditor";

export function NightHoursSheet({
  open,
  onOpenChange,
  nightStartHour,
  nightEndHour,
  onChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nightStartHour: number;
  nightEndHour: number;
  onChange: (nightStartHour: number, nightEndHour: number) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="夜晚時段設定">
      <NightHoursEditor nightStartHour={nightStartHour} nightEndHour={nightEndHour} onChange={onChange} />
    </Sheet>
  );
}
