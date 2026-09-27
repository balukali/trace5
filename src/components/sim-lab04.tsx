"use client";

import * as React from "react";
import { SIM_FILES, TRAVERSAL_SUGGESTIONS, simulateDownload, DOCS_ROOT } from "@/lib/sim/lab04-files";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EvidenceFlag, RequestInspector } from "@/components/http-inspector";
import { Folder, FileText, ShieldAlert } from "lucide-react";

const FLAG_DISCLOSURE = "FLAG{ARBITRARY_FILE_DISCLOSURE}";
const FLAG_NORMALIZER = "FLAG{RESOLVE_THEN_CONFINE}";
const FLAG_FINAL = "FLAG{PATHS_SHOULD_STAY_IN_BOUNDS}";

export function Lab04Sim({ onEvidence }: { onEvidence: (key: string) => void }) {
  const [file, setFile] = React.useState("report.pdf");
  const [res, setRes] = React.useState<ReturnType<typeof simulateDownload> | null>(null);
  const [normalizerRun, setNormalizerRun] = React.useState(false);

  function request(value: string) {
    const result = simulateDownload(value);
    setRes(result);
    if (result.classification === "allowed") onEvidence("lab-04:allowed-download");
    if (result.escaped) onEvidence("lab-04:escape");
    if (result.classification === "traversal" && result.status === 200) {
      onEvidence("lab-04:file-read");
    }
  }

  return (
    <div className="space-y-4">
      <div className="panel p-5">
        <h3 className="hud-label">Simulated filesystem</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Fictional training artefacts. No real filesystem is ever accessed.
        </p>
        <ul className="mt-4 space-y-2">
          {SIM_FILES.map((f) => (
            <li key={f.path} className="flex items-center gap-2 text-xs">
              {f.kind === "document" ? (
                <FileText className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              ) : (
                <ShieldAlert className="h-3.5 w-3.5 text-rose-400" aria-hidden="true" />
              )}
              <span className="font-mono text-foreground">{f.path}</span>
              <span className="ml-auto text-muted-foreground">{f.size}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
          <Folder className="h-3.5 w-3.5" aria-hidden="true" />
          Document root: <span className="font-mono text-primary">{DOCS_ROOT}/</span>
        </p>
      </div>

      <div className="panel p-5">
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            request(file);
          }}
        >
          <label htmlFor="l4-file" className="sr-only">
            File parameter
          </label>
          <Input
            id="l4-file"
            value={file}
            onChange={(e) => setFile(e.target.value)}
            placeholder="report.pdf"
            className="font-mono"
            autoComplete="off"
            spellCheck={false}
          />
          <Button type="submit" className="sm:w-40">
            Download
          </Button>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          {TRAVERSAL_SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setFile(s);
                request(s);
              }}
              className="rounded border border-border bg-muted/50 px-2 py-1 font-mono text-[11px] text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <RequestInspector
        request={res?.requestLine ?? `GET /download?file=${encodeURIComponent(file || "<empty>")}`}
        response={
          res
            ? `HTTP/1.1 ${res.status} ${res.statusText}\nX-Resolved-Path: ${res.resolvedPath}\n\n${
                res.content ?? JSON.stringify({ error: "not found" })
              }`
            : null
        }
        title="Download handler"
      />

      {res && (
        <div
          className={`panel p-5 ${res.classification === "traversal" ? "border-rose-500/50" : ""}`}
          role="status"
        >
          <p className="hud-label">
            Resolved training path: <span className="text-primary">{res.resolvedPath}</span>
          </p>
          <ul className="mt-3 space-y-1.5">
            {res.observations.map((o, i) => (
              <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                <span className="text-primary" aria-hidden="true">
                  ▸
                </span>
                {o}
              </li>
            ))}
          </ul>
          {res.classification === "traversal" && (
            <div className="mt-4 space-y-3">
              <EvidenceFlag flag={FLAG_DISCLOSURE} label="File disclosure confirmed" tone="rose" />
              <div className="rounded-md border border-border bg-black/50 p-3">
                <p className="hud-label">Disclosed content</p>
                <pre className="mt-1.5 whitespace-pre-wrap font-mono text-[11px] text-muted-foreground">
                  {res.content}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="panel p-5">
        <h3 className="hud-label">Path normalizer</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Shows how a correct implementation resolves the same input.
        </p>
        <Button
          className="mt-3"
          size="sm"
          variant="outline"
          onClick={() => {
            setNormalizerRun(true);
            onEvidence("lab-04:normalizer");
            request(file);
          }}
        >
          Run normalizer
        </Button>
        {normalizerRun && (
          <div className="mt-3 space-y-3">
            <pre className="scroll-thin overflow-x-auto rounded-md border border-border bg-black/50 p-3 font-mono text-[11px] text-muted-foreground">
              {`root      = ${DOCS_ROOT}\ninput     = ${file}\nresolved  = ${res?.resolvedPath ?? "—"}\ncontained = ${res ? (res.escaped ? "NO" : "yes") : "—"}`}
            </pre>
            <EvidenceFlag flag={FLAG_NORMALIZER} label="Containment check" tone="cyan" />
          </div>
        )}
      </div>

      <div className="panel p-5">
        <h3 className="hud-label">Assessment panel</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Releases the final flag once the traversal and normalizer evidence is recorded.
        </p>
        <div className="mt-3">
          <EvidenceFlag flag={FLAG_FINAL} label="Final flag" tone="emerald" />
        </div>
      </div>
    </div>
  );
}

