"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Lock, Zap } from "lucide-react";
import type { Lab } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DifficultyStars } from "@/components/difficulty-stars";
import { cn } from "@/lib/utils";

export function LabCard({
  lab,
  solved,
  locked = false,
}: {
  lab: Lab;
  solved: Record<string, unknown>;
  locked?: boolean;
}) {
  const done = lab.challenges.filter((c) => solved[c.id]).length;
  const total = lab.challenges.length;
  const complete = done === total;
  const pct = (done / total) * 100;
  const started = done > 0;

  return (
    <article
      className={cn(
        "panel group relative flex flex-col overflow-hidden p-5 transition-colors",
        locked
          ? "opacity-60"
          : complete
            ? "border-emerald-500/40"
            : "hover:border-primary/50",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="hud-label">Lab {String(lab.number).padStart(2, "0")}</p>
          <h3 className="mt-1.5 text-lg font-semibold tracking-tight">{lab.title}</h3>
          <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wider text-primary">
            {lab.codename}
          </p>
        </div>
        {complete ? (
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" aria-label="Lab complete" />
        ) : locked ? (
          <Lock className="h-5 w-5 shrink-0 text-muted-foreground" aria-label="Locked" />
        ) : null}
      </div>

      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
        {lab.tagline}
      </p>

      <div className="mt-4">
        <DifficultyStars level={lab.difficulty} />
      </div>

      <div className="mt-4 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-mono tabular-nums text-foreground">
            {done} / {total}
          </span>
        </div>
        <Progress value={pct} aria-label={`Lab ${lab.number} progress`} />
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Zap className="h-3.5 w-3.5 text-trace-amber" aria-hidden="true" />
          {lab.xpTotal.toLocaleString()} XP
        </span>
        {!locked && (
          <Button asChild size="sm" variant={started ? "default" : "outline"}>
            <Link href={`/labs/${lab.id}`}>
              {complete ? "Review" : started ? "Resume" : "Enter Lab"}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        )}
      </div>
    </article>
  );
}
