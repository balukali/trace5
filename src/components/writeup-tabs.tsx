"use client";

import * as React from "react";
import { BookOpen, Lightbulb, FileText, Wrench, Globe, Lock } from "lucide-react";
import type { WriteUp } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

const TABS = [
  { id: "overview", label: "Overview", icon: BookOpen },
  { id: "concept", label: "Concept", icon: Lightbulb },
  { id: "solution", label: "Solution", icon: FileText },
  { id: "why", label: "Why It Works", icon: Wrench },
  { id: "remediation", label: "Remediation", icon: Wrench },
  { id: "realWorld", label: "Real World", icon: Globe },
] as const;

const KEYS = {
  overview: "overview",
  concept: "concept",
  solution: "solution",
  why: "whyItWorks",
  remediation: "remediation",
  realWorld: "realWorld",
} as const;

export function WriteUpTabs({
  writeUp,
  unlocked,
  onReveal,
}: {
  writeUp: WriteUp;
  unlocked: boolean;
  /** Called when the learner chooses to reveal early. Deducts XP and unlocks. */
  onReveal?: () => void;
}) {
  const [confirm, setConfirm] = React.useState(false);

  function reveal() {
    setConfirm(true);
  }

  if (!unlocked) {
    return (
      <>
        <div className="panel flex flex-col items-center gap-3 border-dashed p-8 text-center">
          <Lock className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
          <div>
            <p className="font-semibold">Write-up locked</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              Complete every challenge in this lab, or reveal the walkthrough early at a cost of 50
              XP. The walkthrough contains the full answer key and the remediation plan.
            </p>
          </div>
          <Button variant="outline" onClick={reveal}>
            Reveal walkthrough (−50 XP)
          </Button>
        </div>

        <Dialog open={confirm} onOpenChange={setConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reveal the walkthrough?</DialogTitle>
              <DialogDescription>
                This deducts 50 XP from your score. You will still be able to complete any remaining
                challenges afterwards.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setConfirm(false)}>
                Keep solving
              </Button>
              <Button
                onClick={() => {
                  onReveal?.();
                  setConfirm(false);
                }}
              >
                Reveal walkthrough
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <div className="panel overflow-hidden">
      <p className="flex items-center gap-2 border-b border-border bg-card/60 px-4 py-3 hud-label">
        <BookOpen className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
        Lab write-up
      </p>
      <div className="px-4 pt-4">
        <Tabs defaultValue="overview">
          <TabsList aria-label="Write-up sections">
            {TABS.map((t) => (
              <TabsTrigger key={t.id} value={t.id}>
                <t.icon className="h-3.5 w-3.5" aria-hidden="true" />
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {TABS.map((t) => (
            <TabsContent key={t.id} value={t.id}>
              <div
                className={cn(
                  "rounded-md border border-border bg-background/50 p-4",
                  t.id === "solution" && "border-primary/40",
                )}
              >
                <p className="prose-ctf whitespace-pre-line">{writeUp[KEYS[t.id]]}</p>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <div className="border-t border-border bg-card/40 px-4 py-3">
        <p className="hud-label">Lab flag</p>
        <code className="mt-1 block break-all font-mono text-sm font-bold text-emerald-300">
          {writeUp.flag}
        </code>
      </div>
    </div>
  );
}
