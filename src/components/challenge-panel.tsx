"use client";

import * as React from "react";
import { Check, Lightbulb, Lock, Send, X, BookOpen, Award, Terminal } from "lucide-react";
import type { Challenge } from "@/lib/types";
import { validateSubmission, type SubmissionValue, type Verdict } from "@/lib/ctf-engine";
import { playCorrectSound, playWrongSound } from "@/lib/verdict-audio";
import { registerAttempt } from "@/lib/attempt-log";
import { progressStore } from "@/lib/progress-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CodeCompare } from "@/components/code-compare";
import { LearningPanelView } from "@/components/learning-panel";
import { HintsPanel } from "@/components/hints-panel";
import { WalkthroughDialog } from "@/components/walkthrough-dialog";
import { cn } from "@/lib/utils";

export interface ChallengePanelProps {
  challenge: Challenge;
  solved: boolean;
  hintsUsed: number;
  evidence: string[];
  walkthroughRevealed: boolean;
  onSolved: (xp: number) => void;
  onRevealWalkthrough: () => void;
}

export function ChallengePanel({
  challenge,
  solved,
  hintsUsed,
  evidence,
  walkthroughRevealed,
  onSolved,
  onRevealWalkthrough,
}: ChallengePanelProps) {
  const [selected, setSelected] = React.useState<string[]>([]);
  const [flagValue, setFlagValue] = React.useState("");
  const [report, setReport] = React.useState<Record<string, string>>({});
  const [verdict, setVerdict] = React.useState<Verdict | null>(null);
  const [attempts, setAttempts] = React.useState(0);
  const [revealedHints, setRevealedHints] = React.useState<number[]>([]);
  const [pendingHint, setPendingHint] = React.useState<number | null>(null);
  const [showWalkthrough, setShowWalkthrough] = React.useState(false);
  const [showLearn, setShowLearn] = React.useState(false);

  React.useEffect(() => {
    setSelected([]);
    setFlagValue("");
    setReport({});
    setVerdict(null);
    setAttempts(0);
    setRevealedHints([]);
    setShowWalkthrough(false);
    setShowLearn(false);
  }, [challenge.id]);

  const multi = challenge.type === "multiple-answer";
  const isFlag = challenge.type === "flag";
  const isReport = challenge.type === "report";
  const evidenceReady = (challenge.requiresEvidence ?? []).every((k) => evidence.includes(k));

  function toggleOption(id: string) {
    if (solved) return;
    setSelected((prev) =>
      multi ? (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]) : [id],
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const submission: SubmissionValue = isFlag
      ? { kind: "flag", value: flagValue }
      : isReport
        ? { kind: "report", fields: report }
        : { kind: "choice", ids: selected };

    const result = validateSubmission(challenge, submission, {
      evidence,
      hintsUsed,
      walkthroughRevealed,
    });
    setVerdict(result);
    setAttempts((a) => a + 1);
    registerAttempt(challenge.id);

    if (result.status === "correct") {
      playCorrectSound();
    } else {
      playWrongSound();
    }

    if (result.status === "correct" && !solved) {
      const previous = progressStore.getState().solved[challenge.id];
      progressStore.markSolved(challenge.id, {
        xpAwarded: result.awardedXp,
        hintsUsed,
        walkthroughRevealed,
        attempts: (previous?.attempts ?? 0) + attempts + 1,
      });
      onSolved(result.awardedXp);
      setShowLearn(true);
    }
  }

  function confirmHint() {
    if (pendingHint === null) return;
    const hint = challenge.hints[pendingHint];
    progressStore.registerHintUse(challenge.id, hint.cost);
    setRevealedHints((prev) => [...prev, hint.level]);
    setPendingHint(null);
  }

  const canSubmit = isFlag
    ? flagValue.trim().length > 0
    : isReport
      ? (challenge.reportFields ?? []).every((f) => (report[f.id] ?? "").trim().length >= 12)
      : selected.length > 0;

  return (
    <section className="space-y-4" aria-labelledby={`challenge-${challenge.id}`}>
      <header className="panel p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="font-mono">
            CHALLENGE {challenge.index}
          </Badge>
          <Badge>{challenge.difficulty}</Badge>
          <Badge variant="secondary" className="font-mono">
            {challenge.xp} XP
          </Badge>
          {isFlag && (
            <Badge variant="warning" className="font-mono">
              <Terminal className="h-3 w-3" /> flag
            </Badge>
          )}
          {solved && (
            <Badge variant="success" className="font-mono">
              <Check className="h-3 w-3" /> solved
            </Badge>
          )}
        </div>

        <h2 id={`challenge-${challenge.id}`} className="mt-3 text-xl font-bold tracking-tight">
          {challenge.codename}: {challenge.title}
        </h2>
        <p className="mt-1 font-mono text-xs uppercase tracking-wider text-muted-foreground">
          Objective — {challenge.objective}
        </p>
        <p className="prose-ctf mt-3">{challenge.description}</p>
      </header>

      {!evidenceReady && (
        <div
          className="flex items-start gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4"
          role="note"
        >
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" aria-hidden="true" />
          <div className="text-sm text-amber-100">
            <p className="font-medium">Investigation step required</p>
            <p className="mt-1 text-amber-200/80">
              Complete the required action in the target environment before submitting an answer.
            </p>
          </div>
        </div>
      )}

      {challenge.code && <CodeCompare code={challenge.code} />}

      <form onSubmit={handleSubmit} className="panel space-y-4 p-5">
        <fieldset disabled={solved}>
          <legend className="hud-label mb-3">
            {isFlag
              ? "Submit flag"
              : isReport
                ? "Incident report"
                : multi
                  ? "Select every statement that applies"
                  : "Select one answer"}
          </legend>

          {isFlag && (
            <div className="space-y-2">
              <label htmlFor={`flag-${challenge.id}`} className="sr-only">
                Flag
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id={`flag-${challenge.id}`}
                  value={flagValue}
                  onChange={(e) => setFlagValue(e.target.value)}
                  placeholder="FLAG{...}"
                  className="font-mono"
                  autoComplete="off"
                  spellCheck={false}
                />
                <Button type="submit" disabled={!canSubmit} className="sm:w-40">
                  <Send className="h-4 w-4" /> Submit Flag
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Flags are case-insensitive and are checked locally against a stored digest.
              </p>
            </div>
          )}

          {!isFlag && !isReport && (
            <div className="space-y-2">
              {challenge.options?.map((opt) => {
                const checked = selected.includes(opt.id);
                return (
                  <label
                    key={opt.id}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm transition-colors",
                      checked
                        ? "border-primary/60 bg-primary/10"
                        : "border-border hover:border-primary/40 hover:bg-muted/40",
                      solved && "cursor-default",
                    )}
                  >
                    <input
                      type={multi ? "checkbox" : "radio"}
                      name={`opt-${challenge.id}`}
                      value={opt.id}
                      checked={checked}
                      onChange={() => toggleOption(opt.id)}
                      className="mt-1 h-4 w-4 accent-[hsl(var(--primary))]"
                    />
                    <span className={cn(checked ? "text-foreground" : "text-muted-foreground")}>
                      {opt.label}
                    </span>
                  </label>
                );
              })}
              <Button type="submit" disabled={!canSubmit} className="mt-2 w-full sm:w-44">
                <Send className="h-4 w-4" /> Submit answer
              </Button>
            </div>
          )}

          {isReport && (
            <div className="space-y-4">
              {challenge.reportFields?.map((field) => (
                <div key={field.id}>
                  <label htmlFor={`rep-${field.id}`} className="text-sm font-medium">
                    {field.label}
                  </label>
                  <Textarea
                    id={`rep-${field.id}`}
                    value={report[field.id] ?? ""}
                    onChange={(e) => setReport((p) => ({ ...p, [field.id]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="mt-1.5"
                  />
                </div>
              ))}
              <Button type="submit" disabled={!canSubmit} className="w-full sm:w-48">
                <Send className="h-4 w-4" /> Submit report
              </Button>
            </div>
          )}
        </fieldset>

        {verdict && (
          <div
            role="status"
            aria-live="polite"
            className={cn(
              "flex items-start gap-3 rounded-md border p-3 text-sm",
              verdict.status === "correct"
                ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-200"
                : "border-rose-500/50 bg-rose-500/10 text-rose-200",
            )}
          >
            {verdict.status === "correct" ? (
              <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            ) : (
              <X className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            )}
            <div>
              <p className="font-mono font-semibold">
                {verdict.status === "correct" ? "✓ FLAG ACCEPTED" : "✗ INVALID FLAG"}
                {verdict.status === "correct" && ` +${verdict.awardedXp} XP`}
              </p>
              <p className="mt-0.5 text-xs opacity-90">
                {verdict.status === "correct"
                  ? "Challenge complete. Read the learning panel below."
                  : verdict.message}
              </p>
            </div>
          </div>
        )}
      </form>

      <HintsPanel challenge={challenge} revealed={revealedHints} onRequest={setPendingHint} />

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowLearn((v) => !v)}
          aria-expanded={showLearn}
        >
          <BookOpen className="h-4 w-4" />
          {showLearn ? "Hide" : "Show"} learning panel
        </Button>
        <Button variant="outline" size="sm" onClick={() => setShowWalkthrough(true)} disabled={solved}>
          <Award className="h-4 w-4" /> Reveal walkthrough (−50 XP)
        </Button>
      </div>

      {showLearn && <LearningPanelView challenge={challenge} solved={solved} />}

      <Dialog open={pendingHint !== null} onOpenChange={(o) => !o && setPendingHint(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reveal hint {pendingHint !== null ? pendingHint + 1 : ""}?</DialogTitle>
            <DialogDescription>
              {pendingHint !== null && (
                <>
                  This hint will cost{" "}
                  <span className="font-mono text-amber-300">
                    {challenge.hints[pendingHint].cost} XP
                  </span>
                  . Hints guide your thinking but reduce your score for this challenge.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPendingHint(null)}>
              Cancel
            </Button>
            <Button onClick={confirmHint}>
              <Lightbulb className="h-4 w-4" /> Reveal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <WalkthroughDialog
        open={showWalkthrough}
        onOpenChange={setShowWalkthrough}
        challenge={challenge}
        onReveal={onRevealWalkthrough}
      />
    </section>
  );
}


