import { useEffect } from "react";
import { useTimelineStore } from "./state/useTimelineStore";
import { OnboardingFlow } from "./screens/OnboardingFlow";
import { TimelineScreen } from "./screens/TimelineScreen";

export default function App() {
  const { self, partner, hydrated, hydrate } = useTimelineStore();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  if (!hydrated) {
    return <div className="h-full" />;
  }

  if (!self || !partner) {
    return <OnboardingFlow />;
  }

  return <TimelineScreen self={self} partner={partner} />;
}
