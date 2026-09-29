"use client";

import * as React from "react";
import {
  SIMULATED_REVIEWS,
  STORED_REVIEW,
  STORED_REVIEW_NOTES,
  analyzeBypass,
  analyzeSearchTerm,
  type AnalysisResult,
  type BypassResult,
} from "@/lib/sim/lab03-xss";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EvidenceFlag, RequestInspector } from "@/components/http-inspector";
import { cn } from "@/lib/utils";

const FLAG_MARKUP = "FLAG{INPUT_IS_DATA_NOT_CODE}";
const FLAG_ENCODER = "FLAG{ENCODING_IS_THE_DEFENSE}";
const FLAG_STORED = "FLAG{STORED_PERSISTS_BEYOND_THE_REQUEST}";
const FLAG_FINAL = "FLAG{ESCAPE_OUTPUT_NOT_TRUST}";

const FLAG_BYPASS = "FLAG{FILTER_IS_NOT_A_BOUNDARY}";

const SAMPLES = ["laptop", "<b>test</b>", "<img src=x onerror=alert(1)>"];

export function Lab03Sim({ onEvidence }: { onEvidence: (key: string) => void }) {
  const [term, setTerm] = React.useState("laptop");
  const [analysis, setAnalysis] = React.useState<AnalysisResult | null>(null);
  const [bypass, setBypass] = React.useState<BypassResult | null>(null);
  const [encoderOpen, setEncoderOpen] = React.useState(false);
  const [storedViewed, setStoredViewed] = React.useState(false);

  function search(value: string) {
    const res = analyzeSearchTerm(value);
    setAnalysis(res);
    onEvidence("lab-03:plain-search");
    if (res.classification !== "plain") onEvidence("lab-03:markup");
  }

  return (
    <div className="space-y-4">
      <div className="panel p-5">
        <h3 className="hud-label">Northstar feedback portal</h3>
        <form
          className="mt-3 flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            search(term);
          }}
        >
          <label htmlFor="l3-q" className="sr-only">
            Search products
          </label>
          <Input
            id="l3-q"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="laptop"
            autoComplete="off"
            spellCheck={false}
          />
          <Button type="submit" className="sm:w-32">
            Search
          </Button>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          {SAMPLES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setTerm(s);
                search(s);
              }}
              className="rounded border border-border bg-muted/50 px-2 py-1 font-mono text-[11px] text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <RequestInspector
        request={`GET /search?q=${encodeURIComponent(term || "<empty>")}`}
        response={
          analysis
            ? `HTTP/1.1 200 OK\nContent-Type: text/html\n\n<h2>Search results for: ${analysis.parsedText}</h2>\n<p>classification: ${analysis.classification}</p>\n<p>would_execute_script: ${analysis.wouldExecuteScript}</p>`
            : null
        }
        title="Simulated search response"
      />

      {analysis && (
        <div
          className={`panel p-5 ${
            analysis.classification === "script"
              ? "border-rose-500/50"
              : analysis.classification === "plain"
                ? ""
                : "border-amber-500/50"
          }`}
          role="status"
        >
          <p className="hud-label">Render analysis (simulated)</p>
          <ul className="mt-3 space-y-1.5">
            {analysis.interpretation.map((line, i) => (
              <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                <span className="text-primary" aria-hidden="true">
                  ▸
                </span>
                {line}
              </li>
            ))}
          </ul>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-rose-500/40 bg-rose-500/10 p-3">
              <p className="hud-label text-rose-300">Vulnerable render (description only)</p>
              <p className="mt-1.5 break-all font-mono text-[11px] text-rose-100/90">{term}</p>
              <p className="mt-2 text-[11px] text-rose-200/80">
                A vulnerable renderer would build DOM nodes from this value. TRACE//5 does not — no
                learner JavaScript is ever executed.
              </p>
            </div>
            <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3">
              <p className="hud-label text-emerald-300">Safe render (encoded)</p>
              <p className="mt-1.5 break-all font-mono text-[11px] text-emerald-100/90">
                {analysis.escaped}
              </p>
              <p className="mt-2 text-[11px] text-emerald-200/80">
                Encoded output is displayed as this text, with no structure and no behaviour.
              </p>
            </div>
          </div>

          {analysis.classification !== "plain" && (
            <div className="mt-4">
              <EvidenceFlag flag={FLAG_MARKUP} label="Markup interpretation confirmed" />
            </div>
          )}
        </div>
      )}

      <div className="panel p-5">
        <h3 className="hud-label">Content filter (naive)</h3>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          This release shipped a filter that deletes complete{" "}
          <code className="font-mono">&lt;script&gt;…&lt;/script&gt;</code> blocks plus{" "}
          <code className="font-mono">on…=</code> handlers and{" "}
          <code className="font-mono">javascript:</code> URIs, then renders the result. The filter
          looks convincing. It is not a security boundary — a payload only has to survive the string
          filter to be interpreted by the parser. The analysis below shows what survives and why.
        </p>

        <form
          className="mt-3 flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            const b = analyzeBypass(term);
            setBypass(b);
            if (b.bypasses) onEvidence("lab-03:bypass");
          }}
        >
          <label htmlFor="l3-filter" className="sr-only">
            Test a payload against the content filter
          </label>
          <Input
            id="l3-filter"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="payload to test against the filter"
            autoComplete="off"
            spellCheck={false}
            className="font-mono"
          />
          <Button type="submit" className="sm:w-44">
            Test the filter
          </Button>
        </form>

        {bypass && (
          <div className="mt-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-border bg-muted/40 p-3">
                <p className="hud-label">After the filter</p>
                <p className="mt-1.5 break-all font-mono text-[11px]">
                  {bypass.afterFilter || "(empty — the filter removed everything)"}
                </p>
              </div>
              <div
                className={cn(
                  "rounded-md border p-3",
                  bypass.bypasses
                    ? "border-rose-500/50 bg-rose-500/10"
                    : "border-border bg-muted/40",
                )}
              >
                <p className="hud-label">Parser verdict</p>
                <p className="mt-1.5 font-mono text-[11px]">
                  {bypass.bypasses
                    ? "STILL LIVE — the filter was bypassed"
                    : "Neutralised by the filter"}
                </p>
              </div>
            </div>

            <div>
              <p className="hud-label">Bypass families exercised</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {bypass.families.map((f) => (
                  <Badge key={f} variant="outline" className="font-mono text-[11px]">
                    {f}
                  </Badge>
                ))}
              </div>
            </div>

            {bypass.notes.length > 0 && (
              <ul className="list-disc space-y-1 pl-5 text-[11px] text-muted-foreground">
                {bypass.notes.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            )}

            {bypass.bypasses && (
              <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3">
                <p className="hud-label text-amber-300">Filter bypassed</p>
                <p className="mt-1.5 text-[11px] text-amber-100/90">
                  A payload survived a filter that looked like it removed the dangerous part. Copy
                  the bypass token below and submit it as the flag.
                </p>
                <div className="mt-2">
                  <EvidenceFlag
                    flag={FLAG_BYPASS}
                    label="Filter bypass confirmed — the filter is not a control"
                    tone="amber"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="panel p-5">
        <h3 className="hud-label">Encoder demonstration</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Shows how the same value is treated in different rendering contexts.
        </p>
        <Button
          className="mt-3"
          size="sm"
          variant="outline"
          onClick={() => {
            setEncoderOpen((v) => !v);
            if (!encoderOpen) onEvidence("lab-03:encoder");
          }}
        >
          {encoderOpen ? "Hide" : "Show"} encoder comparison
        </Button>
        {encoderOpen && (
          <div className="mt-3">
            <EvidenceFlag flag={FLAG_ENCODER} label="Context encoding confirmed" tone="cyan" />
          </div>
        )}
      </div>

      <div className="panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="hud-label">Stored reviews</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Content saved earlier and rendered for every visitor.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setStoredViewed(true);
              onEvidence("lab-03:stored-view");
            }}
          >
            View product page
          </Button>
        </div>

        {storedViewed && (
          <div className="mt-4 space-y-3">
            <ul className="space-y-2">
              {SIMULATED_REVIEWS.map((r) => (
                <li key={r.id} className="rounded-md border border-border bg-background/50 p-3">
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {r.author} · {r.rating}/5 · {r.product}
                  </p>
                  <p className="mt-1 text-sm text-foreground">{r.body}</p>
                </li>
              ))}
              <li className="rounded-md border border-rose-500/50 bg-rose-500/10 p-3">
                <p className="font-mono text-[11px] text-rose-300">
                  {STORED_REVIEW.author} · {STORED_REVIEW.rating}/5 · {STORED_REVIEW.product}
                </p>
                <p className="mt-1 break-all font-mono text-xs text-rose-100/90">
                  {STORED_REVIEW.body}
                </p>
                <p className="mt-2 text-[11px] text-rose-200/80">
                  Classified as a script-bearing payload. Displayed as inert text — never executed.
                </p>
              </li>
            </ul>
            <ul className="space-y-1.5">
              {STORED_REVIEW_NOTES.map((n, i) => (
                <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                  <span className="text-primary" aria-hidden="true">
                    ▸
                  </span>
                  {n}
                </li>
              ))}
            </ul>
            <EvidenceFlag flag={FLAG_STORED} label="Stored payload confirmed" tone="rose" />
          </div>
        )}
      </div>

      <div className="panel p-5">
        <h3 className="hud-label">Assessment panel</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Releases the final flag once the markup, encoder and stored-payload evidence is recorded.
        </p>
        <div className="mt-3">
          <EvidenceFlag flag={FLAG_FINAL} label="Final flag" tone="emerald" />
        </div>
      </div>
    </div>
  );
}
