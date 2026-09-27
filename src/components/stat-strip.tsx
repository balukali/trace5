"use client";

import { useProgress } from "@/lib/progress-context";
import { LABS, TOTAL_CHALLENGES } from "@/lib/data/labs";
import { XP_TOTAL } from "@/lib/types";

export function StatStrip() {
  const { state, hydrated } = useProgress();
  const solved = Object.keys(state.solved).length;
  const labsDone = LABS.filter((l) => l.challenges.every((c) => state.solved[c.id])).length;

  const stats = [
    { label: "Labs", value: String(LABS.length).padStart(2, "0") },
    { label: "Challenges", value: String(TOTAL_CHALLENGES).padStart(2, "0") },
    { label: "Total XP", value: XP_TOTAL.toLocaleString() },
    {
      label: "Your progress",
      value: hydrated ? `${solved}/${TOTAL_CHALLENGES}` : "—",
      accent: true,
    },
  ];

  return (
    <dl className="mx-auto mt-12 grid max-w-2xl grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className="bg-card/80 px-4 py-5 text-center">
          <dt className="hud-label">{s.label}</dt>
          <dd
            className={`mt-1.5 font-mono text-2xl font-bold tabular-nums ${
              s.accent ? "text-primary" : "text-foreground"
            }`}
          >
            {s.value}
          </dd>
        </div>
      ))}
      <span className="sr-only">
        {labsDone} of {LABS.length} labs completed.
      </span>
    </dl>
  );
}
