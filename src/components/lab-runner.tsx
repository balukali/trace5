"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Monitor,
  ScrollText,
  Terminal as TerminalIcon,
  Trophy,
  Flag,
} from "lucide-react";
import type { Lab } from "@/lib/types";
import { getNextLab } from "@/lib/data/labs";
import { useProgress, progressStore } from "@/lib/progress-context";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChallengePanel } from "@/components/challenge-panel";
import { SimTerminal } from "@/components/sim-terminal";
import { WriteUpTabs } from "@/components/writeup-tabs";
import { Lab01Sim } from "@/components/sim-lab01";
import { Lab02Sim } from "@/components/sim-lab02";
import { Lab03Sim } from "@/components/sim-lab03";
import { Lab04Sim } from "@/components/sim-lab04";
import { Lab05Sim } from "@/components/sim-lab05";
import { cn } from "@/lib/utils";

type MobileTab = "challenge" | "target" | "terminal" | "writeup";

export function LabRunner({ lab }: { lab: Lab }) {
  const router = useRouter();
  const params = useSearchParams();
  const { state } = useProgress();

  const firstUnsolved = lab.challenges.find((c) => !state.solved[c.id]) ?? lab.challenges[0];
  const requested = params.get("c");
  const initial = lab.challenges.some((c) => c.id === requested) ? requested! : firstUnsolved.id;

  const [activeId, setActiveId] = React.useState(initial);
  const [mobileTab, setMobileTab] = React.useState<MobileTab>("challenge");
  const [showTerminal, setShowTerminal] = React.useState(false);

  const active = lab.challenges.find((c) => c.id === activeId) ?? lab.challenges[0];
  const evidence = state.evidence[lab.id] ?? [];
  const solvedCount = lab.challenges.filter((c) => state.solved[c.id]).length;
  const labComplete = solvedCount === lab.challenges.length;
  const walkthroughRevealed = state.walkthroughs.includes(lab.id);
  const next = getNextLab(lab.id);

  function recordEvidence(key: string) {
    if (!key.startsWith(lab.id)) return;
    progressStore.recordEvidence(lab.id, key);
  }

  function selectChallenge(id: string) {
    setActiveId(id);
    setMobileTab("challenge");
    progressStore.setLastChallenge(id);
    router.replace(`/labs/${lab.id}/run?c=${id}`, { scroll: false });
  }

  function onSolved() {
    if (lab.challenges.every((c) => progressStore.isSolved(c.id))) {
      progressStore.markCompleted();
    }
  }

  const sim = {
    "lab-01": <Lab01Sim onEvidence={recordEvidence} />,
    "lab-02": <Lab02Sim onEvidence={recordEvidence} />,
    "lab-03": <Lab03Sim onEvidence={recordEvidence} />,
    "lab-04": <Lab04Sim onEvidence={recordEvidence} />,
    "lab-05": <Lab05Sim onEvidence={recordEvidence} />,
  }[lab.id];


  return (
    <div className="container py-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href={`/labs/${lab.id}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Lab {String(lab.number).padStart(2, "0")} briefing
        </Link>

        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-muted-foreground">
            {solvedCount} / {lab.challenges.length} solved
          </span>
          <Progress
            className="w-32"
            value={(solvedCount / lab.challenges.length) * 100}
            aria-label="Lab progress"
          />
        </div>
      </div>

      <div className="mt-5 hidden lg:grid lg:grid-cols-[240px_minmax(0,1fr)_minmax(0,460px)] lg:gap-5">
        <nav aria-label="Challenges" className="space-y-2">
          {lab.challenges.map((c) => {
            const solved = Boolean(state.solved[c.id]);
            const isActive = c.id === activeId;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => selectChallenge(c.id)}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "flex w-full items-start gap-3 rounded-md border p-3 text-left transition-colors",
                  isActive
                    ? "border-primary/60 bg-primary/10"
                    : "border-border hover:border-primary/40 hover:bg-muted/40",
                )}
              >
                {solved ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
                ) : (
                  <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">
                    {String(c.index).padStart(2, "0")} · {c.codename}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-muted-foreground">
                    {c.xp} XP · {c.difficulty}
                  </span>
                </span>
              </button>
            );
          })}

          <div className="pt-2">
            <Button
              variant={showTerminal ? "secondary" : "outline"}
              size="sm"
              className="w-full"
              onClick={() => setShowTerminal((v) => !v)}
              aria-expanded={showTerminal}
            >
              <TerminalIcon className="h-4 w-4" />
              {showTerminal ? "Hide terminal" : "Open terminal"}
            </Button>
            {showTerminal && (
              <SimTerminal labId={lab.id} onEvidence={recordEvidence} className="mt-3" />
            )}
          </div>
        </nav>

        <div className="min-w-0">
          <ChallengePanel
            challenge={active}
            solved={Boolean(state.solved[active.id])}
            hintsUsed={state.hintsUsed[active.id] ?? 0}
            evidence={evidence}
            walkthroughRevealed={walkthroughRevealed}
            onSolved={onSolved}
            onRevealWalkthrough={() => progressStore.revealWalkthrough(lab.id, 50)}
          />
        </div>

        <aside className="min-w-0 space-y-4">
          <div className="panel p-4">
            <p className="flex items-center gap-2 hud-label">
              <Monitor className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              Target — {lab.target}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              This is a fully simulated target running in your browser. No request leaves your
              machine.
            </p>
          </div>
          {sim}
        </aside>
      </div>


      <div className="mt-5 lg:hidden">
        <div
          className="sticky top-16 z-30 -mx-4 flex gap-1 overflow-x-auto border-b border-border bg-background/95 px-4 py-2 backdrop-blur scroll-thin"
          role="tablist"
          aria-label="Lab sections"
        >
          {(
            [
              { id: "challenge", label: "Challenge", icon: Flag },
              { id: "target", label: "Target", icon: Monitor },
              { id: "terminal", label: "Terminal", icon: TerminalIcon },
              { id: "writeup", label: "Write-up", icon: ScrollText },
            ] as { id: MobileTab; label: string; icon: React.ElementType }[]
          ).map((t) => (
            <button
              key={t.id}
              role="tab"
              type="button"
              aria-selected={mobileTab === t.id}
              onClick={() => setMobileTab(t.id)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors",
                mobileTab === t.id
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-muted/50",
              )}
            >
              <t.icon className="h-3.5 w-3.5" aria-hidden="true" />
              {t.label}
            </button>
          ))}
        </div>

        {mobileTab === "challenge" && (
          <div className="space-y-3 pt-4">
            <div className="flex gap-2 overflow-x-auto pb-1 scroll-thin">
              {lab.challenges.map((c) => {
                const solved = Boolean(state.solved[c.id]);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => selectChallenge(c.id)}
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs",
                      c.id === activeId
                        ? "border-primary/60 bg-primary/10 text-primary"
                        : "border-border text-muted-foreground",
                    )}
                  >
                    {solved ? (
                      <CheckCircle2 className="h-3 w-3 text-emerald-400" aria-hidden="true" />
                    ) : null}
                    {c.codename}
                  </button>
                );
              })}
            </div>
            <ChallengePanel
              challenge={active}
              solved={Boolean(state.solved[active.id])}
              hintsUsed={state.hintsUsed[active.id] ?? 0}
              evidence={evidence}
              walkthroughRevealed={walkthroughRevealed}
              onSolved={onSolved}
              onRevealWalkthrough={() => progressStore.revealWalkthrough(lab.id, 50)}
            />
          </div>
        )}

        {mobileTab === "target" && <div className="pt-4">{sim}</div>}
        {mobileTab === "terminal" && (
          <div className="pt-4">
            <SimTerminal labId={lab.id} onEvidence={recordEvidence} />
          </div>
        )}
        {mobileTab === "writeup" && (
          <div className="space-y-4 pt-4">
            <WriteUpTabs
              writeUp={lab.writeUp}
              unlocked={labComplete || walkthroughRevealed}
              onReveal={() => progressStore.revealWalkthrough(lab.id, 50)}
            />
            {labComplete && next && (
              <Button asChild className="w-full">
                <Link href={`/labs/${next.id}`}>
                  <Trophy className="h-4 w-4" /> Next lab: {next.title}
                </Link>
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="mt-8 hidden lg:block">
        <WriteUpTabs
          writeUp={lab.writeUp}
          unlocked={labComplete || walkthroughRevealed}
          onReveal={() => progressStore.revealWalkthrough(lab.id, 50)}
        />
        {labComplete && next && (
          <div className="mt-4 flex justify-center">
            <Button asChild size="lg">
              <Link href={`/labs/${next.id}`}>
                <Trophy className="h-4 w-4" /> Next lab: {next.title}
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
