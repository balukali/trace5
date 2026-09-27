"use client";

import * as React from "react";
import {
  EVIDENCE_CHAIN,
  INTERNAL_FIELDS,
  NETWORK_REQUESTS,
  PATCH_RESPONSE,
  PATCH_SENT_BODY,
  PATCH_UI_BODY,
  PROFILE_MINIMAL,
  PROFILE_RESPONSE,
  RATE_LIMIT_GUIDANCE,
  RATE_LIMIT_LOG,
  getOrder,
} from "@/lib/sim/lab05-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EvidenceFlag } from "@/components/http-inspector";
import { Activity, ArrowRight, Eye, Gauge, Layers } from "lucide-react";

const FLAG_PROFILE = "FLAG{RETURN_ONLY_WHAT_IS_NEEDED}";
const FLAG_OBJECTS = "FLAG{OWNERSHIP_CHECK_PER_OBJECT}";
const FLAG_MASS = "FLAG{ALLOWLIST_FIELDS_ON_UPDATE}";
const FLAG_CHAIN = "FLAG{WEAKNESSES_CHAIN}";
const FLAG_FINAL = "FLAG{SMALL_WEAKNESSES_CAN_COMBINE}";

export function Lab05Sim({ onEvidence }: { onEvidence: (key: string) => void }) {
  const [profileViewed, setProfileViewed] = React.useState(false);
  const [minimalShown, setMinimalShown] = React.useState(false);
  const [orderId, setOrderId] = React.useState("1021");
  const [orderRes, setOrderRes] = React.useState<ReturnType<typeof getOrder> | null>(null);
  const [patchSent, setPatchSent] = React.useState(false);
  const [logViewed, setLogViewed] = React.useState(false);
  const [chainSeen, setChainSeen] = React.useState(false);

  function fetchOrder(value: string) {
    const res = getOrder(value);
    setOrderRes(res);
    if (res.status === 200 && res.owned) onEvidence("lab-05:own-order");
    if (res.status === 200 && !res.owned) onEvidence("lab-05:foreign-order");
  }

  return (
    <div className="space-y-4">
      <section className="panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 hud-label">
            <Activity className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            Network inspector â€” dashboard load
          </h3>
          <Button size="sm" variant="outline" onClick={() => onEvidence("lab-05:discovery")}>
            Replay requests
          </Button>
        </div>
        <ul className="mt-4 space-y-2">
          {NETWORK_REQUESTS.map((r) => (
            <li key={r.id} className="rounded-md border border-border bg-background/50 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="success" className="font-mono">
                  {r.method}
                </Badge>
                <span className="font-mono text-xs text-foreground">{r.path}</span>
                <span className="font-mono text-[11px] text-emerald-400">{r.status}</span>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">{r.note}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 hud-label">
            <Layers className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            GET /api/profile â€” response inspection
          </h3>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => {
                setProfileViewed(true);
                onEvidence("lab-05:profile");
              }}
            >
              <Eye className="h-3.5 w-3.5" /> Inspect response
            </Button>
            <Button size="sm" variant="outline" onClick={() => setMinimalShown((v) => !v)}>
              {minimalShown ? "Hide" : "Show"} minimal response
            </Button>
          </div>
        </div>

        {profileViewed && (
          <div className="mt-4 space-y-3">
            <pre className="scroll-thin overflow-x-auto rounded-md border border-border bg-black/50 p-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
              {PROFILE_RESPONSE}
            </pre>
            <p className="text-xs text-muted-foreground">
              Internal-only fields present in the response:{" "}
              <span className="font-mono text-rose-300">{INTERNAL_FIELDS.join(", ")}</span>
            </p>
            <EvidenceFlag
              flag={FLAG_PROFILE}
              label="Excessive data exposure confirmed"
              tone="amber"
            />
            {minimalShown && (
              <pre className="scroll-thin overflow-x-auto rounded-md border border-emerald-500/40 bg-emerald-500/5 p-3 font-mono text-[11px] leading-relaxed text-emerald-100/90">
                {PROFILE_MINIMAL}
              </pre>
            )}
          </div>
        )}
      </section>

      <section className="panel p-5">
        <h3 className="hud-label">GET /api/orders/:id â€” object access</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Signed in as user 1021 (alex). Identifiers are sequential integers.
        </p>
        <form
          className="mt-3 flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            fetchOrder(orderId);
          }}
        >
          <label htmlFor="l5-order" className="sr-only">
            Order identifier
          </label>
          <Input
            id="l5-order"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            className="font-mono"
            inputMode="numeric"
          />
          <Button type="submit" className="sm:w-40">
            Fetch order
          </Button>
        </form>

        {orderRes && (
          <div className="mt-4 space-y-3">
            <pre className="scroll-thin overflow-x-auto rounded-md border border-border bg-black/50 p-3 font-mono text-[11px] text-muted-foreground">
              {`HTTP/1.1 ${orderRes.status} ${orderRes.status === 200 ? "OK" : "Not Found"}\n\n${orderRes.body}`}
            </pre>
            <ul className="space-y-1.5">
              {orderRes.observations.map((o, i) => (
                <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                  <span className="text-primary" aria-hidden="true">
                    â–¸
                  </span>
                  {o}
                </li>
              ))}
            </ul>
            {orderRes.status === 200 && !orderRes.owned && (
              <EvidenceFlag
                flag={FLAG_OBJECTS}
                label="Broken object authorization confirmed"
                tone="rose"
              />
            )}
          </div>
        )}
      </section>

      <section className="panel p-5">
        <h3 className="hud-label">PATCH /api/profile â€” mass assignment</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-border bg-background/50 p-3">
            <p className="hud-label">What the UI sends</p>
            <pre className="mt-2 whitespace-pre-wrap font-mono text-[11px] text-muted-foreground">
              {PATCH_UI_BODY}
            </pre>
          </div>
          <div className="rounded-md border border-rose-500/40 bg-rose-500/5 p-3">
            <p className="hud-label text-rose-300">What we actually send</p>
            <pre className="mt-2 whitespace-pre-wrap font-mono text-[11px] text-rose-100/90">
              {PATCH_SENT_BODY}
            </pre>
          </div>
        </div>
        <Button
          className="mt-3"
          size="sm"
          onClick={() => {
            setPatchSent(true);
            onEvidence("lab-05:mass-assign");
          }}
        >
          Send PATCH request
        </Button>
        {patchSent && (
          <div className="mt-3 space-y-3">
            <pre className="scroll-thin overflow-x-auto rounded-md border border-rose-500/40 bg-rose-500/5 p-3 font-mono text-[11px] text-rose-100/90">
              {PATCH_RESPONSE}
            </pre>
            <EvidenceFlag flag={FLAG_MASS} label="Mass assignment confirmed" tone="rose" />
          </div>
        )}
      </section>


      <section className="panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 hud-label">
            <Gauge className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            Access log â€” throttling analysis
          </h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setLogViewed(true);
              onEvidence("lab-05:rate-log");
            }}
          >
            Analyse traffic
          </Button>
        </div>
        {logViewed && (
          <div className="mt-3 space-y-3">
            <pre className="scroll-thin max-h-56 overflow-auto rounded-md border border-border bg-black/50 p-3 font-mono text-[11px] text-muted-foreground">
              {RATE_LIMIT_LOG}
            </pre>
            <div className="rounded-md border border-border bg-background/50 p-3">
              <p className="hud-label">Controls to consider</p>
              <ul className="mt-2 space-y-1.5">
                {RATE_LIMIT_GUIDANCE.map((g, i) => (
                  <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                    <span className="text-primary" aria-hidden="true">
                      â–¸
                    </span>
                    {g}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </section>

      <section className="panel p-5">
        <h3 className="hud-label">Attack chain</h3>
        <Button
          className="mt-3"
          size="sm"
          variant="outline"
          onClick={() => {
            setChainSeen(true);
            onEvidence("lab-05:chain");
          }}
        >
          Assemble the chain
        </Button>
        {chainSeen && (
          <div className="mt-3 space-y-3">
            <ol className="space-y-1.5">
              {EVIDENCE_CHAIN.map((step, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ArrowRight className="h-3 w-3 shrink-0 text-primary" aria-hidden="true" />
                  {step}
                </li>
              ))}
            </ol>
            <EvidenceFlag flag={FLAG_CHAIN} label="Chain assembled" tone="amber" />
          </div>
        )}
      </section>

      <section className="panel p-5">
        <h3 className="hud-label">Assessment panel</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Releases the final flag once all five findings have been recorded.
        </p>
        <div className="mt-3">
          <EvidenceFlag flag={FLAG_FINAL} label="Final flag" tone="emerald" />
        </div>
      </section>
    </div>
  );
}
