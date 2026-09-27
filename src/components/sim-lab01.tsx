import * as React from "react";
import { SUGGESTED_TRAINING_INPUTS, buildLoginRequest, simulateLogin } from "@/lib/sim/lab01-login";
import { PORTAL_SCHEMA } from "@/lib/sim/terminal-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RequestInspector, EvidenceFlag } from "@/components/http-inspector";

const FLAG_INJECTION = "FLAG{LOGIC_BEFORE_STRINGS}";
const FLAG_SCHEMA = "FLAG{HASH_IT_NEVER_STORE_PLAINTEXT}";
const FLAG_FINAL = "FLAG{PARAMETERIZED_QUERIES_SAVE_LOGINS}";

export function Lab01Sim({ onEvidence }: { onEvidence: (key: string) => void }) {
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [result, setResult] = React.useState<ReturnType<typeof simulateLogin> | null>(null);
  const [schemaOpen, setSchemaOpen] = React.useState(false);
  const [assessment, setAssessment] = React.useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = simulateLogin(username, password);
    setResult(res);
    onEvidence("lab-01:login-attempt");
    if (res.outcome === "altered") onEvidence("lab-01:injection");
  }

  const evidenceReady = result?.outcome === "altered" && schemaOpen;
  const req = buildLoginRequest(username || "<empty>", password ? "****" : "<empty>");

  return (
    <div className="space-y-4">
      <div className="panel p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-mono text-sm font-semibold text-primary">
            northstar-systems / employee-portal
          </h3>
          <Badge variant="outline" className="font-mono">
            v2.4
          </Badge>
        </div>

        <form onSubmit={submit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="l1-user" className="hud-label">
              Username
            </label>
            <Input
              id="l1-user"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="alex"
              className="mt-1.5"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <div>
            <label htmlFor="l1-pass" className="hud-label">
              Password
            </label>
            <Input
              id="l1-pass"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1.5"
              autoComplete="off"
            />
          </div>
          <Button type="submit" className="w-full">
            Login
          </Button>
        </form>

        <div className="mt-4">
          <p className="hud-label">Training inputs</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {SUGGESTED_TRAINING_INPUTS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setUsername(s);
                  setPassword("anything");
                }}
                className="rounded border border-border bg-muted/50 px-2 py-1 font-mono text-[11px] text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <RequestInspector
        request={`${req.method} ${req.path}\nContent-Type: ${req.contentType}\n\nusername=${
          req.body.username
        }&password=${req.body.password}`}
        response={
          result
            ? `HTTP/1.1 ${result.status} ${result.statusText}\n\n${JSON.stringify(
                { message: result.message },
                null,
                2,
              )}`
            : null
        }
      />

      {result && (
        <div
          className={`panel p-5 ${result.outcome === "altered" ? "border-amber-500/50" : ""}`}
          role="status"
        >
          <p className="hud-label">Response</p>
          <p className="mt-2 text-sm text-foreground">{result.message}</p>
          <ul className="mt-3 space-y-1.5">
            {result.observations.map((o, i) => (
              <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                <span className="text-primary" aria-hidden="true">
                  ▸
                </span>
                {o}
              </li>
            ))}
          </ul>
          {result.outcome === "altered" && (
            <div className="mt-4">
              <EvidenceFlag flag={FLAG_INJECTION} />
            </div>
          )}
        </div>
      )}

      <div className="panel p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="hud-label">Database schema inspector</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Inspect how the users table stores credentials.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSchemaOpen(true);
              onEvidence("lab-01:schema");
            }}
          >
            {schemaOpen ? "Loaded" : "Load schema"}
          </Button>
        </div>
        {schemaOpen && (
          <div className="mt-3">
            <pre className="scroll-thin overflow-x-auto rounded-md border border-border bg-black/50 p-3 font-mono text-xs leading-relaxed text-muted-foreground">
              {PORTAL_SCHEMA}
            </pre>
            <div className="mt-3">
              <EvidenceFlag flag={FLAG_SCHEMA} tone="cyan" />
            </div>
          </div>
        )}
      </div>

      <div className="panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="hud-label">Assessment panel</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Releases the final flag once the schema and injection evidence are recorded.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setAssessment(true);
              onEvidence("lab-01:assessment");
            }}
          >
            Generate report
          </Button>
        </div>
        {assessment && (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-muted-foreground">
              Preliminary finding: the authentication decision is influenced by untrusted input
              {evidenceReady ? "." : ". Record the schema and injection evidence to complete it."}
            </p>
            <EvidenceFlag flag={FLAG_FINAL} label="Final flag" tone="emerald" />
          </div>
        )}
      </div>
    </div>
  );
}

