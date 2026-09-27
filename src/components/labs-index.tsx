"use client";

import { LABS } from "@/lib/data/labs";
import { useProgress } from "@/lib/progress-context";
import { LabCard } from "@/components/lab-card";
import { TOTAL_CHALLENGES, XP_TOTAL } from "@/lib/types";
import { ShieldCheck } from "lucide-react";

export function LabsIndex() {
  const { state } = useProgress();
  const solved = Object.keys(state.solved).length;

  return (
    <div className="container space-y-8 py-10">
      <header className="max-w-3xl">
        <p className="hud-label">The Range</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Five investigations</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Each lab is a self-contained assessment of a fictional Northstar Systems application.
          Difficulty increases with each lab, and every lab is worth {XP_TOTAL / 5} XP across{" "}
          {TOTAL_CHALLENGES} challenges in total.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {LABS.map((lab) => (
          <LabCard key={lab.id} lab={lab} solved={state.solved} />
        ))}
      </div>

      <section className="panel flex flex-col gap-3 border-amber-500/30 bg-amber-500/5 p-5 sm:flex-row sm:items-center">
        <ShieldCheck className="h-5 w-5 shrink-0 text-amber-300" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-amber-200">Educational simulation.</span> Every target,
          user, invoice and file is fictional training data. No input you type is ever executed,
          queried against a real database, or sent over the network. Progress is stored locally in
          your browser — {solved} of {TOTAL_CHALLENGES} challenges solved so far.
        </p>
      </section>
    </div>
  );
}
