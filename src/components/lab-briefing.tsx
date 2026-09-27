"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Play, ShieldAlert, Target } from "lucide-react";
import type { Lab } from "@/lib/types";
import { getNextLab } from "@/lib/data/labs";
import { useProgress, progressStore } from "@/lib/progress-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DifficultyStars } from "@/components/difficulty-stars";

export function LabBriefing({ lab }: { lab: Lab }) {
  const router = useRouter();
  const { state } = useProgress();
  const done = lab.challenges.filter((c) => state.solved[c.id]).length;
  const total = lab.challenges.length;
  const next = getNextLab(lab.id);

  function enter() {
    progressStore.setLastChallenge(lab.challenges[0].id);
    router.push(`/labs/${lab.id}/run`);
  }

  return (
    <div className="container py-10">
      <Link
        href="/labs"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> All labs
      </Link>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <header className="panel relative overflow-hidden p-6 sm:p-8">
            <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" aria-hidden="true" />
            <div className="relative">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="outline" className="font-mono">
                  LAB {String(lab.number).padStart(2, "0")}
                </Badge>
                <Badge>{lab.codename}</Badge>
                <DifficultyStars level={lab.difficulty} />
              </div>

              <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{lab.title}</h1>
              <p className="mt-2 text-base text-muted-foreground">{lab.tagline}</p>

              <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-5 text-sm sm:grid-cols-4">
                <div>
                  <dt className="hud-label">Target</dt>
                  <dd className="mt-1 font-mono text-xs text-foreground">{lab.target}</dd>
                </div>
                <div>
                  <dt className="hud-label">Challenges</dt>
                  <dd className="mt-1 font-mono text-foreground">
                    {done} / {total}
                  </dd>
                </div>
                <div>
                  <dt className="hud-label">XP available</dt>
                  <dd className="mt-1 font-mono text-foreground">{lab.xpTotal.toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="hud-label">Status</dt>
                  <dd className="mt-1 flex items-center gap-1.5 text-foreground">
                    {done === total ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Complete
                      </>
                    ) : done > 0 ? (
                      "In progress"
                    ) : (
                      "Not started"
                    )}
                  </dd>
                </div>
              </dl>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" onClick={enter} className="w-full sm:w-auto">
                  <Play className="h-4 w-4" />
                  {done > 0 ? "Resume investigation" : "Enter lab"}
                </Button>
                {next && (
                  <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                    <Link href={`/labs/${next.id}`}>
                      Next lab <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </header>

          <section className="panel p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              <BookOpen className="h-4 w-4 text-primary" aria-hidden="true" />
              Engagement briefing
            </h2>
            <div className="prose-ctf mt-4 space-y-3">
              {lab.story.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </section>

          <section className="panel p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              <Target className="h-4 w-4 text-primary" aria-hidden="true" />
              Objectives
            </h2>
            <ol className="mt-4 space-y-2.5">
              {lab.objectives.map((obj, i) => (
                <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                  <span className="font-mono text-xs text-primary">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{obj}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="panel p-5">
            <h2 className="hud-label">Challenge index</h2>
            <ul className="mt-4 space-y-2">
              {lab.challenges.map((c) => {
                const solved = Boolean(state.solved[c.id]);
                return (
                  <li key={c.id} className="flex items-start gap-3 text-sm">
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] ${
                        solved
                          ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-300"
                          : "border-border text-muted-foreground"
                      }`}
                      aria-hidden="true"
                    >
                      {solved ? "OK" : c.index}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={solved ? "text-foreground" : "text-muted-foreground"}>
                        {c.codename}
                      </span>
                      <span className="block text-xs text-muted-foreground/70">
                        {c.xp} XP Â· {c.difficulty}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
            <Progress
              className="mt-5"
              value={(done / total) * 100}
              aria-label={`Lab ${lab.number} progress`}
            />
          </section>

          <section className="panel p-5">
            <h2 className="hud-label">Concepts in this lab</h2>
            <ul className="mt-4 space-y-3">
              {lab.concepts.map((c) => (
                <li key={c.name} className="rounded-md border border-border bg-background/50 p-3">
                  <p className="font-mono text-xs uppercase tracking-wider text-primary">{c.klass}</p>
                  <p className="mt-1 text-sm font-semibold">{c.name}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{c.coreIdea}</p>
                  <p className="mt-2 text-xs text-emerald-300">Defense: {c.defense}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="panel border-amber-500/30 bg-amber-500/5 p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-amber-200">
              <ShieldAlert className="h-4 w-4" aria-hidden="true" />
              Rules of engagement
            </h2>
            <ul className="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground">
              <li>Every target in TRACE//5 is a simulation running in your browser.</li>
              <li>No input you type is ever executed, queried, or sent to a real system.</li>
              <li>Flags and evidence are validated locally against stored digests.</li>
              <li>Progress is stored in this browser only.</li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
