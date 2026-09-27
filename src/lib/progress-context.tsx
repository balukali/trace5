"use client";

import * as React from "react";
import { progressStore } from "@/lib/progress-store";
import type { ProgressState } from "@/lib/types";

type ProgressContextValue = {
  state: ProgressState;
  hydrated: boolean;
};

const ProgressContext = React.createContext<ProgressContextValue>({
  state: { version: 1, xp: 0, solved: {}, hintsUsed: {}, walkthroughs: [], evidence: {} },
  hydrated: false,
});

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<ProgressState>(progressStore.getState());
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    progressStore.hydrate();
    setState(progressStore.getState());
    setHydrated(true);
    return progressStore.subscribe(setState);
  }, []);

  const value = React.useMemo(() => ({ state, hydrated }), [state, hydrated]);

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  return React.useContext(ProgressContext);
}

export { progressStore };
