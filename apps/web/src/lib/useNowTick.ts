import { useEffect, useState } from "react";
import { DateTime } from "luxon";

export function useNowTick(intervalMs = 15_000): DateTime {
  const [now, setNow] = useState(() => DateTime.utc());

  useEffect(() => {
    const id = setInterval(() => setNow(DateTime.utc()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
