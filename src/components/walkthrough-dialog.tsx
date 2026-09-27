"use client";

import { ScrollText, TriangleAlert } from "lucide-react";
import type { Challenge } from "@/lib/types";
import { Button } from "@/components/ui/button";
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

export function WalkthroughDialog({
  open,
  onOpenChange,
  challenge,
  onReveal,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  challenge: Challenge;
  onReveal: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TriangleAlert className="h-4 w-4 text-trace-amber" aria-hidden="true" />
            Reveal walkthrough
          </DialogTitle>
          <DialogDescription>
            Revealing the solution now costs 50 XP. Solving first keeps the full reward and is almost
            always the better outcome for your learning.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto scroll-thin pr-1">
          {challenge.code && <CodeCompare code={challenge.code} />}
          <LearningPanelView challenge={challenge} solved />
          {challenge.options && challenge.options.length > 0 && (
            <div className="panel p-4">
              <p className="hud-label">Answer key</p>
              <ul className="mt-3 space-y-2 text-sm">
                {challenge.options.map((o) => (
                  <li key={o.id} className="flex items-start gap-2">
                    <span
                      className={
                        o.correct
                          ? "font-mono text-emerald-400"
                          : "font-mono text-muted-foreground/50"
                      }
                      aria-hidden="true"
                    >
                      {o.correct ? "✓" : "✗"}
                    </span>
                    <span className={o.correct ? "text-foreground" : "text-muted-foreground line-through"}>
                      {o.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onReveal();
              onOpenChange(false);
            }}
          >
            <ScrollText className="h-4 w-4" /> Reveal anyway
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
