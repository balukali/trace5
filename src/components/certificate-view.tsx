"use client";

import * as React from "react";
import Link from "next/link";
import { Award, Lock, Printer, ShieldCheck } from "lucide-react";
import { LABS, TOTAL_CHALLENGES } from "@/lib/data/labs";
import { useProgress, progressStore } from "@/lib/progress-context";
import { XP_TOTAL } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

export function CertificateView() {
  const { state, hydrated } = useProgress();
  const [name, setName] = React.useState(state.certName ?? "");
  const savedName = state.certName?.trim();

  const labsDone = LABS.filter((l) => l.challenges.every((c) => state.solved[c.id])).length;
  const challengesDone = Object.keys(state.solved).length;
  const unlocked = labsDone === LABS.length;

  const completedDate = state.completedAt
    ? new Date(state.completedAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="container space-y-8 py-10">
      <header className="max-w-3xl no-print">
        <p className="hud-label">Recognition</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Cybersecurity Investigator certificate
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Complete all five TRACE//5 investigations to unlock a print-friendly certificate. Your
          name and score are stored only in this browser.
        </p>
      </header>

      {!unlocked && (
        <section className="panel no-print p-5">
          <div className="flex items-start gap-3">
            <Lock className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <div className="flex-1">
              <p className="font-semibold">Certificate locked</p>
              <p className="mt-1 text-sm text-muted-foreground">
                You have completed {labsDone} of {LABS.length} labs. Finish every challenge in every
                lab to unlock it.
              </p>
              <Progress
                className="mt-4"
                value={(labsDone / LABS.length) * 100}
                aria-label="Certificate progress"
              />
              <Button asChild className="mt-4">
                <Link href="/labs">Continue investigating</Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {unlocked && (
        <section className="no-print panel p-5">
          <p className="hud-label">Print your certificate</p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label htmlFor="cert-name" className="text-sm font-medium">
                Name on certificate
              </label>
              <Input
                id="cert-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="mt-1.5"
                maxLength={60}
              />
            </div>
            <Button onClick={() => progressStore.setCertName(name.trim())}>Save name</Button>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4" /> Print / save as PDF
            </Button>
          </div>
        </section>
      )}

      <section
        className="relative overflow-hidden rounded-lg border-2 border-primary/40 bg-card p-8 text-center shadow-2xl print:border-black print:bg-white print:text-black print:shadow-none sm:p-12"
        aria-label="Certificate preview"
      >
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-50 print:hidden" aria-hidden="true" />
        <div className="relative">
          <p className="font-mono text-2xl font-black tracking-tight sm:text-3xl">
            TRACE<span className="text-primary print:text-black">{"//"}</span>5
          </p>
          <p className="mt-1 hud-label">Cybersecurity Investigation Range</p>

          <div className="mx-auto mt-6 h-px w-40 bg-primary/60" aria-hidden="true" />

          <h2 className="mt-6 text-lg font-semibold uppercase tracking-[0.3em] text-muted-foreground print:text-neutral-700">
            Cybersecurity Investigator
          </h2>

          <p className="mt-6 text-sm text-muted-foreground print:text-neutral-700">
            This certifies that
          </p>
          <p className="mt-2 font-serif text-3xl font-bold italic sm:text-4xl">
            {savedName || "________________________"}
          </p>
          <p className="mx-auto mt-4 max-w-lg text-sm text-muted-foreground print:text-neutral-700">
            completed all five TRACE//5 investigations, identifying and explaining authentication,
            access control, injection, traversal and API security weaknesses in simulated Northstar
            Systems applications.
          </p>

          <dl className="mx-auto mt-8 grid max-w-xl grid-cols-3 gap-4 border-t border-border pt-6 print:border-neutral-300">
            <div>
              <dt className="hud-label print:text-neutral-600">Labs</dt>
              <dd className="mt-1 font-mono text-2xl font-bold tabular-nums">
                {LABS.length} / {LABS.length}
              </dd>
            </div>
            <div>
              <dt className="hud-label print:text-neutral-600">Challenges</dt>
              <dd className="mt-1 font-mono text-2xl font-bold tabular-nums">{TOTAL_CHALLENGES}+</dd>
            </div>
            <div>
              <dt className="hud-label print:text-neutral-600">XP</dt>
              <dd className="mt-1 font-mono text-2xl font-bold tabular-nums">
                {hydrated ? state.xp.toLocaleString() : "â€”"}
              </dd>
            </div>
          </dl>

          <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground print:border-neutral-300 sm:flex-row print:text-neutral-600">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Educational training platform â€” simulated targets only
            </span>
            <span className="flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5" aria-hidden="true" />
              {completedDate ?? "Date of completion recorded locally"}
            </span>
          </div>
        </div>
      </section>

      {hydrated && (
        <p className="text-center text-xs text-muted-foreground no-print">
          {challengesDone} of {TOTAL_CHALLENGES} challenges solved Â· maximum possible score{" "}
          {XP_TOTAL.toLocaleString()} XP
        </p>
      )}
    </div>
  );
}
