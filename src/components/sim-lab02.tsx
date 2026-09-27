"use client";

import * as React from "react";
import { INVOICE_ID_SUGGESTIONS, simulateInvoiceRequest } from "@/lib/sim/lab02-invoices";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RequestInspector, EvidenceFlag } from "@/components/http-inspector";

const FLAG_ENUM = "FLAG{SEQUENTIAL_IDS_LEAK_DATA}";
const FLAG_FINAL = "FLAG{OBJECTS_NEED_AUTHORIZATION_TOO}";

export function Lab02Sim({ onEvidence }: { onEvidence: (key: string) => void }) {
  const [id, setId] = React.useState("1042");
  const [res, setRes] = React.useState<ReturnType<typeof simulateInvoiceRequest> | null>(null);

  function send(value: string) {
    const result = simulateInvoiceRequest(value);
    setRes(result);
    if (result.owned && result.status === 200) onEvidence("lab-02:own-invoice");
    if (!result.owned && result.status === 200) onEvidence("lab-02:foreign-object");
  }

  return (
    <div className="space-y-4">
      <div className="panel p-5">
        <h3 className="hud-label">Customer portal — invoices</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Signed in as <span className="font-mono text-primary">alex</span>. Try an identifier that
          is not yours.
        </p>

        <form
          className="mt-4 flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            send(id);
          }}
        >
          <label htmlFor="l2-id" className="sr-only">
            Invoice identifier
          </label>
          <Input
            id="l2-id"
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="1042"
            className="font-mono"
            inputMode="numeric"
          />
          <Button type="submit" className="sm:w-40">
            Send request
          </Button>
        </form>

        <div className="mt-3 flex flex-wrap gap-2">
          {INVOICE_ID_SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setId(s);
                send(s);
              }}
              className="rounded border border-border bg-muted/50 px-2 py-1 font-mono text-[11px] text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <RequestInspector
        request={res?.requestLine ?? `GET /api/invoices/${id || "<empty>"}`}
        response={res ? `HTTP/1.1 ${res.status} ${res.statusText}\n\n${res.body}` : null}
        title="API response"
      />

      {res && (
        <div className={`panel p-5 ${res.finding === "idor" ? "border-rose-500/50" : ""}`} role="status">
          <p className="hud-label">Analysis</p>
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
          {res.finding === "idor" && (
            <div className="mt-4">
              <EvidenceFlag flag={FLAG_ENUM} label="Object-level access confirmed" tone="rose" />
            </div>
          )}
        </div>
      )}

      <div className="panel p-5">
        <h3 className="hud-label">Assessment panel</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Releases the final flag once you have compared an owned object with a foreign one.
        </p>
        <Button
          className="mt-3"
          size="sm"
          onClick={() => onEvidence("lab-02:assessment")}
        >
          Generate report
        </Button>
        <div className="mt-3">
          <EvidenceFlag flag={FLAG_FINAL} label="Final flag" tone="emerald" />
        </div>
      </div>
    </div>
  );
}
