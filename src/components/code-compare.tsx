import { ShieldAlert, ShieldCheck, FileCode2 } from "lucide-react";
import type { CodeSample } from "@/lib/types";

export function CodeCompare({ code }: { code: CodeSample }) {
  const hasBoth = Boolean(code.vulnerable && code.secure);
  return (
    <div className="panel overflow-hidden">
      <p className="flex items-center gap-2 border-b border-border bg-card/60 px-4 py-2 hud-label">
        <FileCode2 className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
        Code review — {code.language}
      </p>

      <div className={hasBoth ? "grid divide-y divide-border md:grid-cols-2 md:divide-x md:divide-y-0" : ""}>
        {code.vulnerable && (
          <div>
            <p className="flex items-center gap-2 bg-rose-500/10 px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-rose-300">
              <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
              Vulnerable
            </p>
            <pre className="scroll-thin overflow-x-auto bg-black/50 p-4 font-mono text-[11px] leading-relaxed text-rose-100/90">
              {code.vulnerable}
            </pre>
          </div>
        )}

        {code.secure && (
          <div>
            <p className="flex items-center gap-2 bg-emerald-500/10 px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-emerald-300">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Secure
            </p>
            <pre className="scroll-thin overflow-x-auto bg-black/50 p-4 font-mono text-[11px] leading-relaxed text-emerald-100/90">
              {code.secure}
            </pre>
          </div>
        )}
      </div>

      {code.note && (
        <p className="border-t border-border bg-card/40 px-4 py-2.5 text-xs text-muted-foreground">
          {code.note}
        </p>
      )}
    </div>
  );
}
