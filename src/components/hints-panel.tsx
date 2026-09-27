"use client";

import { Lightbulb, Lock } from "lucide-react";
import type { Challenge } from "@/lib/types";
import { Button } from "@/components/ui/button";

export function HintsPanel({
  challenge,
  revealed,
  onRequest,
}: {
  challenge: Challenge;
  revealed: number[];
  onRequest: (index: number) => void;
}) {
  const nextIndex = challenge.hints.findIndex((h) => !revealed.includes(h.level));

  return (
    <div className="panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 hud-label">
          <Lightbulb className="h-3.5 w-3.5 text-trace-amber" aria-hidden="true" />
          Hints
        </p>
        <span className="text-xs text-muted-foreground">
          {revealed.length} of {challenge.hints.length} revealed
        </span>
      </div>

      <ul className="mt-4 space-y-2">
        {challenge.hints.map((hint, index) => {
          const isRevealed = revealed.includes(hint.level);
          const isNext = index === nextIndex;
          return (
            <li
              key={hint.level}
              className="rounded-md border border-border bg-background/50 p-3"
            >
              {isRevealed ? (
                <>
                  <p className="hud-label text-trace-amber">Hint {hint.level}</p>
                  <p className="mt-1.5 text-sm text-foreground">{hint.text}</p>
                  <p className="mt-1.5 text-[11px] text-muted-foreground">−{hint.cost} XP</p>
                </>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                    Hint {hint.level} — costs {hint.cost} XP
                  </span>
                  <Button
                    size="sm"
                    variant={isNext ? "outline" : "ghost"}
                    disabled={!isNext}
                    onClick={() => onRequest(index)}
                  >
                    {isNext ? "Reveal" : "Reveal previous first"}
                  </Button>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <p className="mt-4 text-xs text-muted-foreground">
        Hints never contain the flag. They are meant to point you at the evidence you already have.
      </p>
    </div>
  );
}
