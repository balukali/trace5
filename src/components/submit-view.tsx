"use client";

import * as React from "react";
import Link from "next/link";
import { Flag, Search, CheckCircle2, Circle, X, Send, Info, Filter } from "lucide-react";
import { LABS } from "@/lib/data/labs";
import { useProgress, progressStore } from "@/lib/progress-context";
import { validateSubmission, type Verdict } from "@/lib/ctf-engine";
import { playCorrectSound, playWrongSound } from "@/lib/verdict-audio";
import { registerAttempt, getAttempts } from "@/lib/attempt-log";
import { TOTAL_CHALLENGES, XP_TOTAL, type Challenge } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * A CTFd-style flag submission console.
 *
 * Every challenge is listed with its solve state, and any flag can be submitted
 * from here without navigating into the lab. Verification reuses the same engine
 * the lab runner uses, so a flag accepted here marks the challenge solved and
 * awards the same XP, including hint and walkthrough deductions.
 */

type FilterKey = "all" | "solved" | "unsolved";

/** A verdict narrowed to the accepted case, which is the only one with XP. */
type CorrectVerdict = Extract<Verdict, { status: "correct" }>;

export function SubmitView() {
  const { state } = useProgress();
  const [value, setValue] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<FilterKey>("all");
  const [result, setResult] = React.useState<{ challenge: Challenge; verdict: CorrectVerdict } | null>(null);
  const [attempts, setAttempts] = React.useState<Record<string, number>>({});
  const [rejected, setRejected] = React.useState(false);

  // The attempt tally lives in its own storage key, so read it after mount and
  // refresh it whenever a submission changes it.
  React.useEffect(() => {
    const next: Record<string, number> = {};
    for (const [id, rec] of Object.entries(getAttempts())) next[id] = rec.count;
    setAttempts(next);
  }, [result, rejected]);

  const allChallenges = React.useMemo(() => LABS.flatMap((l) => l.challenges), []);
  const labOf = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const lab of LABS) for (const c of lab.challenges) map.set(c.id, lab.id);
    return map;
  }, []);

  const rows = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    return allChallenges
      .filter((c) => {
        const solved = Boolean(state.solved[c.id]);
        if (filter === "solved" && !solved) return false;
        if (filter === "unsolved" && solved) return false;
        if (!needle) return true;
        return (
          c.title.toLowerCase().includes(needle) ||
          c.codename.toLowerCase().includes(needle) ||
          c.id.toLowerCase().includes(needle) ||
          labOf.get(c.id)?.includes(needle)
        );
      })
      .sort((a, b) => {
        const sa = state.solved[a.id] ? 1 : 0;
        const sb = state.solved[b.id] ? 1 : 0;
        if (sa !== sb) return sa - sb;
        return a.id.localeCompare(b.id);
      });
  }, [allChallenges, filter, query, state.solved, labOf]);

  const solvedCount = Object.keys(state.solved).length;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const submission = value.trim();
    if (!submission) return;
    setValue("");

    // Try the flag against every unsolved challenge. This mirrors how a CTF
    // scoreboard works: you submit a flag, not a challenge id.
    let match: { challenge: Challenge; verdict: CorrectVerdict } | null = null;
    for (const challenge of allChallenges) {
      const verdict = validateSubmission(
        challenge,
        { kind: "flag", value: submission },
        {
          evidence: challenge.requiresEvidence ?? [],
          hintsUsed: state.hintsUsed[challenge.id] ?? 0,
          walkthroughRevealed: state.walkthroughs.includes(challenge.labId),
        },
      );
      if (verdict.status === "correct") {
        match = { challenge, verdict };
        break;
      }
    }

    if (match) {
      playCorrectSound();
      if (!state.solved[match.challenge.id]) {
        const prev = progressStore.getState().solved[match.challenge.id];
        progressStore.markSolved(match.challenge.id, {
          xpAwarded: match.verdict.awardedXp,
          hintsUsed: state.hintsUsed[match.challenge.id] ?? 0,
          walkthroughRevealed: state.walkthroughs.includes(match.challenge.labId),
          attempts: (prev?.attempts ?? 0) + 1,
        });
      }
      setResult(match);
      setRejected(false);
      return;
    }

    playWrongSound();
    // Attribute the failed attempt to the challenge the learner is looking at,
    // falling back to the first unsolved one so the tally stays meaningful.
    const target =
      allChallenges.find((c) => c.id === state.lastChallenge && !state.solved[c.id]) ??
      allChallenges.find((c) => !state.solved[c.id]);
    if (target) registerAttempt(target.id);
    setResult(null);
    setRejected(true);
  }

  return (
    <div className="container space-y-8 py-10">
      <header className="max-w-3xl">
        <p className="hud-label">Flag Submission Console</p>
        <h1 className="mt-2 flex items-center gap-3 text-3xl font-bold tracking-tight sm:text-4xl">
          <Flag className="h-8 w-8 text-primary" aria-hidden="true" />
          Submit a flag
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Paste any flag you have captured and it will be matched against every challenge you have
          not solved yet. A correct flag is accepted and the challenge is marked complete, with the
          same XP you would earn inside the lab. A wrong flag is rejected.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Solved" value={`${solvedCount} / ${TOTAL_CHALLENGES}`} />
        <Stat label="Your XP" value={state.xp.toLocaleString()} />
        <Stat label="Total available" value={XP_TOTAL.toLocaleString()} />
      </div>

      <form onSubmit={handleSubmit} className="panel space-y-3 p-5">
        <label htmlFor="flag-input" className="hud-label">
          Flag
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id="flag-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="FLAG{...}"
            autoComplete="off"
            spellCheck={false}
            className="font-mono"
          />
          <Button type="submit" className="shrink-0" disabled={!value.trim()}>
            <Send className="h-4 w-4" /> Submit
          </Button>
        </div>
        <p
          role="status"
          aria-live="polite"
          className={cn(
            "text-sm",
            result ? "text-emerald-300" : rejected ? "text-rose-300" : "text-muted-foreground",
          )}
        >
          {result ? (
            <span className="font-mono">
              ✓ FLAG ACCEPTED — {result.challenge.codename} (+{result.verdict.awardedXp} XP)
            </span>
          ) : rejected ? (
            <span className="font-mono">✗ INVALID FLAG — no challenge matched.</span>
          ) : (
            "Waiting for a flag."
          )}
        </p>
        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          A rejected flag never reveals which challenge it was checked against, and nothing about
          the correct answer is disclosed.
        </p>
      </form>

      <section aria-labelledby="challenge-list-heading" className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 id="challenge-list-heading" className="hud-label">
            Challenges
          </h2>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                aria-label="Search challenges"
                className="pl-8"
              />
            </div>
            <div className="flex gap-1" role="group" aria-label="Filter challenges">
              {(["all", "solved", "unsolved"] as FilterKey[]).map((key) => (
                <Button
                  key={key}
                  type="button"
                  size="sm"
                  variant={filter === key ? "default" : "outline"}
                  onClick={() => setFilter(key)}
                  aria-pressed={filter === key}
                >
                  <Filter className="h-3.5 w-3.5" aria-hidden="true" />
                  {key}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <ul className="space-y-2">
          {rows.map((c) => {
            const solved = Boolean(state.solved[c.id]);
            const tries = attempts[c.id] ?? 0;
            return (
              <li key={c.id}>
                <Link
                  href={`/labs/${c.labId}/run?c=${c.id}`}
                  className={cn(
                    "panel flex flex-wrap items-center gap-3 p-4 transition-colors hover:border-primary/50",
                    solved && "border-emerald-500/40",
                  )}
                >
                  {solved ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" aria-hidden="true" />
                  ) : (
                    <Circle className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      <span className="font-mono text-xs text-muted-foreground">{c.id}</span>{" "}
                      {c.title}
                    </p>
                    <p className="truncate font-mono text-xs uppercase tracking-wider text-muted-foreground">
                      {c.labId} · {c.codename}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {tries > 0 && (
                      <Badge variant="outline" className="font-mono text-xs">
                        {tries} {tries === 1 ? "try" : "tries"}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {c.difficulty}
                    </Badge>
                    {solved ? (
                      <Badge className="bg-emerald-500/20 text-emerald-200">Solved</Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        Unsolved
                      </Badge>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>

        {rows.length === 0 && (
          <p className="panel p-6 text-center text-sm text-muted-foreground">
            <X className="mx-auto mb-2 h-5 w-5" aria-hidden="true" />
            No challenge matches that filter.
          </p>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel p-4">
      <p className="hud-label">{label}</p>
      <p className="mt-1 font-mono text-2xl font-bold">{value}</p>
    </div>
  );
}
