"use client";

import type { ProgressState, SolvedRecord } from "@/lib/types";

const STORAGE_KEY = "trace5.progress.v1";

export const EMPTY_PROGRESS: ProgressState = {
  version: 1,
  xp: 0,
  solved: {},
  hintsUsed: {},
  walkthroughs: [],
  evidence: {},
};

function safeParse(raw: string | null): ProgressState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<ProgressState>;
    if (!parsed || typeof parsed !== "object" || typeof parsed.version !== "number") {
      return null;
    }
    return {
      ...EMPTY_PROGRESS,
      ...parsed,
      solved: parsed.solved ?? {},
      hintsUsed: parsed.hintsUsed ?? {},
      walkthroughs: parsed.walkthroughs ?? [],
      evidence: parsed.evidence ?? {},
    };
  } catch {
    return null;
  }
}

type Listener = (state: ProgressState) => void;

class ProgressStore {
  private state: ProgressState = EMPTY_PROGRESS;
  private hydrated = false;
  private listeners = new Set<Listener>();

  hydrate() {
    if (this.hydrated) return;
    if (typeof window === "undefined") return;
    this.state = safeParse(window.localStorage.getItem(STORAGE_KEY)) ?? EMPTY_PROGRESS;
    this.hydrated = true;
    this.emit();
  }

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private emit() {
    this.listeners.forEach((fn) => fn(this.state));
  }

  private persist() {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      /* storage full or unavailable — the session still works in memory */
    }
    this.emit();
  }

  getState() {
    return this.state;
  }

  setState(updater: (prev: ProgressState) => ProgressState) {
    this.state = updater(this.state);
    this.persist();
  }

  reset() {
    this.state = { ...EMPTY_PROGRESS };
    this.persist();
  }

  addXp(amount: number) {
    if (amount === 0) return;
    this.setState((prev) => ({ ...prev, xp: Math.max(0, prev.xp + amount) }));
  }

  isSolved(challengeId: string) {
    return Boolean(this.state.solved[challengeId]);
  }

  markSolved(challengeId: string, record: Omit<SolvedRecord, "at">) {
    this.setState((prev) => ({
      ...prev,
      xp: Math.max(0, prev.xp + record.xpAwarded),
      solved: {
        ...prev.solved,
        [challengeId]: { ...record, at: new Date().toISOString() },
      },
    }));
  }

  registerHintUse(challengeId: string, cost: number) {
    this.setState((prev) => {
      const prevRecord = prev.solved[challengeId];
      const hintsUsed = (prev.hintsUsed[challengeId] ?? 0) + 1;
      return {
        ...prev,
        xp: Math.max(0, prev.xp - cost),
        hintsUsed: { ...prev.hintsUsed, [challengeId]: hintsUsed },
        solved: prevRecord
          ? { ...prev.solved, [challengeId]: { ...prevRecord, hintsUsed } }
          : prev.solved,
      };
    });
  }

  revealWalkthrough(labId: string, cost: number) {
    this.setState((prev) => {
      if (prev.walkthroughs.includes(labId)) return prev;
      return {
        ...prev,
        xp: Math.max(0, prev.xp - cost),
        walkthroughs: [...prev.walkthroughs, labId],
      };
    });
  }

  recordEvidence(labId: string, key: string) {
    this.setState((prev) => {
      const current = prev.evidence[labId] ?? [];
      if (current.includes(key)) return prev;
      return {
        ...prev,
        evidence: { ...prev.evidence, [labId]: [...current, key] },
      };
    });
  }

  hasEvidence(labId: string, key: string) {
    return (this.state.evidence[labId] ?? []).includes(key);
  }

  setLastChallenge(challengeId: string) {
    this.setState((prev) => ({ ...prev, lastChallenge: challengeId }));
  }

  setCertName(name: string) {
    this.setState((prev) => ({ ...prev, certName: name }));
  }

  markCompleted() {
    this.setState((prev) =>
      prev.completedAt ? prev : { ...prev, completedAt: new Date().toISOString() },
    );
  }
}

export const progressStore = new ProgressStore();
