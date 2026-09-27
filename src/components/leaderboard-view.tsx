"use client";

import * as React from "react";
import { Trophy, Info, Medal, TrendingUp, RotateCcw } from "lucide-react";
import { LEADERBOARD } from "@/lib/data/concepts";
import { useProgress, progressStore } from "@/lib/progress-context";
import { TOTAL_CHALLENGES, XP_TOTAL } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function LeaderboardView() {
  const { state, hydrated } = useProgress();
  const [confirmReset, setConfirmReset] = React.useState(false);

  const rows = React.useMemo(() => {
    const all = [
      ...LEADERBOARD.map((e) => ({ name: e.name, handle: e.handle, xp: e.xp, you: false })),
      { name: "You", handle: "@investigator", xp: state.xp, you: true },
    ];
    return all.sort((a, b) => b.xp - a.xp).map((e, i) => ({ ...e, rank: i + 1 }));
  }, [state.xp]);

  const yourRank = rows.find((r) => r.you)?.rank ?? rows.length;

  return (
    <div className="container space-y-8 py-10">
      <header className="max-w-3xl">
        <p className="hud-label">Local Training Leaderboard</p>
        <h1 className="mt-2 flex items-center gap-3 text-3xl font-bold tracking-tight sm:text-4xl">
          <Trophy className="h-8 w-8 text-trace-amber" aria-hidden="true" />
          Range standings
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          This is a simulated leaderboard stored entirely in your browser. The other researchers are
          fictional training data — there is no global ranking, no account, and nothing is sent to a
          server. Your score updates as you solve challenges.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Your rank" value={`#${yourRank}`} icon={Medal} />
        <Stat label="Your XP" value={hydrated ? state.xp.toLocaleString() : "—"} icon={TrendingUp} />
        <Stat
          label="Challenges"
          value={`${Object.keys(state.solved).length} / ${TOTAL_CHALLENGES}`}
          icon={Trophy}
        />
      </div>

      <section aria-labelledby="board-heading">
        <h2 id="board-heading" className="hud-label mb-3">
          Rankings
        </h2>
        <ol className="space-y-2">
          {rows.map((r) => (
            <li
              key={r.handle}
              className={cn(
                "flex items-center gap-4 rounded-lg border p-4",
                r.you
                  ? "border-primary/60 bg-primary/10"
                  : "border-border bg-card/60",
              )}
            >
              <span
                className={cn(
                  "w-8 shrink-0 font-mono text-lg font-bold tabular-nums",
                  r.rank <= 3 ? "text-trace-amber" : "text-muted-foreground",
                )}
              >
                {r.rank}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">
                  {r.name}
                  {r.you && <span className="ml-2 chip text-primary">you</span>}
                </span>
                <span className="block font-mono text-xs text-muted-foreground">{r.handle}</span>
              </span>
              <span className="shrink-0 font-mono text-sm font-bold tabular-nums text-primary">
                {r.xp.toLocaleString()} XP
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="panel flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-2 text-sm text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          Maximum possible score is {XP_TOTAL.toLocaleString()} XP before any hint or walkthrough
          deductions. Hints cost 10–30 XP each and revealing a walkthrough costs 50 XP.
        </p>
        <Button variant="outline" size="sm" onClick={() => setConfirmReset(true)}>
          <RotateCcw className="h-4 w-4" /> Reset progress
        </Button>
      </section>

      <Dialog open={confirmReset} onOpenChange={setConfirmReset}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset all progress?</DialogTitle>
            <DialogDescription>
              This clears every solved challenge, hint, flag and XP total from this browser. It
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmReset(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                progressStore.reset();
                setConfirmReset(false);
              }}
            >
              Reset everything
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <div className="panel p-5">
      <p className="flex items-center gap-2 hud-label">
        <Icon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
        {label}
      </p>
      <p className="mt-2 font-mono text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}
