import { useEffect } from "react";
import { useTimelineStore } from "./state/useTimelineStore";
import { OnboardingFlow } from "./screens/OnboardingFlow";
import { TimelineScreen } from "./screens/TimelineScreen";
import { UpdatePrompt } from "./components/UpdatePrompt";

export default function App() {
  const { self, partner, hydrated, hydrate } = useTimelineStore();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  if (!hydrated) {
    return <div className="h-full" />;
  }

  return (
    <>
      {!self || !partner ? <OnboardingFlow /> : <TimelineScreen self={self} partner={partner} />}
      <UpdatePrompt />
    </>
  );
}
