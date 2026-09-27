"use client";

import Link from "next/link";
import { useProgress } from "@/lib/progress-context";
import { LABS } from "@/lib/data/labs";
import { CONCEPT_CARDS } from "@/lib/data/concepts";
import { TOTAL_CHALLENGES, XP_TOTAL } from "@/lib/types";
import { LabCard } from "@/components/lab-card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trophy, BookOpen, ArrowRight, GraduationCap } from "lucide-react";

export function DashboardView() {
  const { state, hydrated } = useProgress();

  const solvedCount = Object.keys(state.solved).length;
  const hintsUsed = Object.values(state.hintsUsed).reduce((a, b) => a + b, 0);
  const unlockedConcepts = CONCEPT_CARDS.filter((c) => state.solved[c.unlocksOn.challengeId]).length;

  const nextLab =
    LABS.find((lab) => lab.challenges.some((c) => !state.solved[c.id])) ?? LABS[LABS.length - 1];

  const stats = [
    { label: "Total XP", value: state.xp.toLocaleString(), sub: `of ${XP_TOTAL.toLocaleString()}` },
    { label: "Challenges solved", value: `${solvedCount}`, sub: `of ${TOTAL_CHALLENGES}` },
    { label: "Hints used", value: `${hintsUsed}`, sub: "across all labs" },
    { label: "Concept cards", value: `${unlockedConcepts}`, sub: `of ${CONCEPT_CARDS.length} unlocked` },
  ];

  return (
    <div className="container space-y-8 py-10">
      <section className="panel relative overflow-hidden p-6 sm:p-8">
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" aria-hidden="true" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="hud-label">Operations Dashboard</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Welcome back, investigator.
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Northstar Systems has five open investigations on your desk. Each one is a simulated
              target built for training: gather evidence, answer questions, capture flags, and write
              the report an engineer would need to fix it.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button asChild>
                <Link href={`/labs/${nextLab.id}`}>
                  {solvedCount === 0 ? "Start Lab 01" : "Resume Investigation"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/labs">All labs</Link>
              </Button>
            </div>
          </div>

          <div className="w-full max-w-xs rounded-lg border border-border bg-background/60 p-5">
            <p className="hud-label">Overall progress</p>
            <p className="mt-2 font-mono text-4xl font-black tabular-nums text-primary">
              {hydrated ? `${Math.round((state.xp / XP_TOTAL) * 100)}%` : "—"}
            </p>
            <Progress
              className="mt-3"
              value={hydrated ? (state.xp / XP_TOTAL) * 100 : 0}
              aria-label="Overall platform progress"
            />
            <p className="mt-3 text-xs text-muted-foreground">
              {solvedCount} of {TOTAL_CHALLENGES} challenges complete
            </p>
          </div>
        </div>
      </section>


      <section aria-label="Your statistics">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label} className="p-5">
              <p className="hud-label">{s.label}</p>
              <p className="mt-2 font-mono text-3xl font-bold tabular-nums">{s.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{s.sub}</p>
            </Card>
          ))}
        </div>
      </section>

      <section aria-labelledby="labs-heading" className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="hud-label">Investigations</p>
            <h2 id="labs-heading" className="mt-1 text-2xl font-bold tracking-tight">
              Lab selection
            </h2>
          </div>
          <p className="hidden text-sm text-muted-foreground sm:block">
            Progress is saved automatically in this browser.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {LABS.map((lab) => (
            <LabCard key={lab.id} lab={lab} solved={state.solved} />
          ))}

          <Card className="flex flex-col justify-between border-dashed p-5">
            <div>
              <p className="hud-label">Extras</p>
              <h3 className="mt-2 text-lg font-semibold">Reference &amp; recognition</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" aria-hidden="true" />
                  Concept card library
                </li>
                <li className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-trace-amber" aria-hidden="true" />
                  Local training leaderboard
                </li>
                <li className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                  Completion certificate
                </li>
              </ul>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href="/concepts">Concepts</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/leaderboard">Ranks</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/certificate">Certificate</Link>
              </Button>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
