"use client";

import Link from "next/link";
import { Lock, BookOpen, CheckCircle2, ArrowRight } from "lucide-react";
import { CONCEPT_CARDS } from "@/lib/data/concepts";
import { useProgress } from "@/lib/progress-context";
import { cn } from "@/lib/utils";

export function ConceptsView() {
  const { state } = useProgress();
  const unlocked = CONCEPT_CARDS.filter((c) => state.solved[c.unlocksOn.challengeId]);

  return (
    <div className="container space-y-8 py-10">
      <header className="max-w-3xl">
        <p className="hud-label">Reference library</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Cybersecurity concepts</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Concept cards unlock as you solve the challenges that teach them. Each card states the
          core idea in one line and the primary defence, so you have a reference you can return to
          long after the lab is closed.
        </p>
        <p className="mt-3 font-mono text-xs text-primary">
          {unlocked.length} / {CONCEPT_CARDS.length} unlocked
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {CONCEPT_CARDS.map((card) => {
          const isUnlocked = Boolean(state.solved[card.unlocksOn.challengeId]);
          return (
            <article
              key={card.id}
              className={cn(
                "panel flex flex-col p-5",
                isUnlocked ? "" : "opacity-60",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
                  {card.klass}
                </p>
                {isUnlocked ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
                ) : (
                  <Lock className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                )}
              </div>

              <h2 className="mt-2 text-lg font-bold uppercase tracking-tight">{card.name}</h2>

              {isUnlocked ? (
                <>
                  <div className="mt-3 space-y-3 text-sm">
                    <p className="text-muted-foreground">
                      <span className="block hud-label mb-1">Core idea</span>
                      {card.coreIdea}
                    </p>
                    <p className="text-emerald-300">
                      <span className="block hud-label mb-1">Defense</span>
                      {card.defense}
                    </p>
                  </div>
                  <ButtonLink card={card} />
                </>
              ) : (
                <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                  Solve the related challenge to unlock.
                </p>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

function ButtonLink({ card }: { card: (typeof CONCEPT_CARDS)[number] }) {
  return (
    <Link
      href={`/labs/${card.unlocksOn.labId}/run?c=${card.unlocksOn.challengeId}`}
      className="mt-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-primary"
    >
      <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
      Review in lab
      <ArrowRight className="h-3 w-3" aria-hidden="true" />
    </Link>
  );
}
