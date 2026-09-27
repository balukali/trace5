"use client";

import * as React from "react";
import { Radio } from "lucide-react";

/**
 * Simulated HTTP inspector used by every lab.
 * It renders predefined strings only. No network request is ever made.
 */
export function RequestInspector({
  request,
  response,
  title = "Request inspector",
  requestLabel = "REQUEST",
  responseLabel = "RESPONSE",
}: {
  request: string;
  response?: string | null;
  title?: string;
  requestLabel?: string;
  responseLabel?: string;
}) {
  return (
    <div className="panel overflow-hidden">
      <p className="flex items-center gap-2 border-b border-border bg-card/60 px-4 py-2 hud-label">
        <Radio className="h-3 w-3 text-primary" aria-hidden="true" />
        {title}
      </p>
      <div className="px-4 pt-3">
        <p className="font-mono text-[10px] uppercase tracking-widest text-primary/70">
          {requestLabel}
        </p>
      </div>
      <pre className="scroll-thin overflow-x-auto bg-black/50 p-4 pt-1.5 font-mono text-[11px] leading-relaxed text-muted-foreground">
        {request}
      </pre>
      {response ? (
        <>
          <div className="border-t border-border px-4 pt-3">
            <p className="font-mono text-[10px] uppercase tracking-widest text-emerald-400/80">
              {responseLabel}
            </p>
          </div>
          <pre className="scroll-thin overflow-x-auto bg-black/70 p-4 pt-1.5 font-mono text-[11px] leading-relaxed text-foreground/90">
            {response}
          </pre>
        </>
      ) : (
        <p className="border-t border-border bg-black/30 px-4 py-2 font-mono text-[11px] text-muted-foreground/60">
          awaiting response…
        </p>
      )}
    </div>
  );
}

export function EvidenceFlag({
  flag,
  label = "Evidence captured",
  tone = "amber",
}: {
  flag: string;
  label?: string;
  tone?: "amber" | "cyan" | "emerald" | "rose";
}) {
  const tones: Record<string, string> = {
    amber: "border-amber-500/40 bg-amber-500/10 text-amber-200 hud-label text-amber-300",
    cyan: "border-cyan-500/40 bg-cyan-500/10 border-cyan-500/40 bg-cyan-500/10 text-cyan-200",
    emerald: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
    rose: "border-rose-500/40 bg-rose-500/10 text-rose-200",
  };
  const labelTones: Record<string, string> = {
    amber: "text-amber-300",
    cyan: "text-cyan-300",
    emerald: "text-emerald-300",
    rose: "text-rose-300",
  };
  return (
    <div className={cn2("rounded-md border p-3", tones[tone])}>
      <p className={cn2("hud-label", labelTones[tone])}>{label}</p>
      <code className="mt-1.5 block break-all font-mono text-sm font-bold">{flag}</code>
    </div>
  );
}

function cn2(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}
