"use client";

import * as React from "react";
import { Terminal as TerminalIcon, Trash2 } from "lucide-react";
import type { LabId } from "@/lib/types";
import { runCommand, terminalBanner, type TerminalLine } from "@/lib/sim/terminal";
import { cn } from "@/lib/utils";

/**
 * Simulated terminal UI.
 *
 * Commands are parsed in the browser against a fixed table (see
 * lib/sim/terminal.ts). Nothing is executed on a server or an operating system.
 */
export function SimTerminal({
  labId,
  onEvidence,
  className,
}: {
  labId: LabId;
  onEvidence?: (key: string) => void;
  className?: string;
}) {
  const [lines, setLines] = React.useState<TerminalLine[]>([
    { id: "0", kind: "system", text: terminalBanner(labId) },
    { id: "1", kind: "system", text: "Type 'help' to see available commands." },
  ]);
  const [input, setInput] = React.useState("");
  const [history, setHistory] = React.useState<string[]>([]);
  const [histIndex, setHistIndex] = React.useState(-1);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const counter = React.useRef(2);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [lines]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = input;
    if (!value.trim()) return;

    const echo: TerminalLine = { id: `in-${counter.current++}`, kind: "input", text: value };
    const result = runCommand(labId, value);
    const out: TerminalLine[] = result.lines.map((l, i) => ({
      ...l,
      id: `out-${counter.current}-${i}`,
    }));

    setLines((prev) => [...prev, echo, ...out]);
    setHistory((h) => [value, ...h].slice(0, 40));
    setHistIndex(-1);
    setInput("");

    if (result.lines.some((l) => l.text === "__CLEAR__")) {
      setLines([]);
      return;
    }
    if (result.evidence && onEvidence) onEvidence(result.evidence);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const next = Math.min(histIndex + 1, history.length - 1);
      if (history[next]) {
        setHistIndex(next);
        setInput(history[next]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = histIndex - 1;
      setHistIndex(next);
      setInput(next < 0 ? "" : (history[next] ?? ""));
    }
  }

  const lineStyle: Record<TerminalLine["kind"], string> = {
    input: "text-foreground",
    output: "text-muted-foreground",
    error: "text-rose-400",
    system: "text-primary/80",
    success: "text-emerald-400",
  };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-black/60 font-mono text-xs",
        className,
      )}
      onClick={() => inputRef.current?.focus()}
    >
      <div className="flex items-center justify-between border-b border-border bg-card/80 px-3 py-2">
        <span className="flex items-center gap-2 text-muted-foreground">
          <TerminalIcon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          trace@northstar:~$ <span className="text-muted-foreground/60">(simulated shell)</span>
        </span>
        <button
          type="button"
          onClick={() => setLines([])}
          className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Clear terminal"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <div
        ref={scrollRef}
        className="scroll-thin h-64 space-y-1 overflow-y-auto p-3"
        role="log"
        aria-live="polite"
        aria-label="Terminal output"
      >
        {lines.length === 0 && (
          <p className="text-muted-foreground/60">Terminal cleared. Type &apos;help&apos;.</p>
        )}
        {lines.map((line) => (
          <pre
            key={line.id}
            className={cn("whitespace-pre-wrap break-words leading-relaxed", lineStyle[line.kind])}
          >
            {line.kind === "input" ? `trace@northstar:~$ ${line.text}` : line.text}
          </pre>
        ))}
      </div>

      <form onSubmit={submit} className="flex items-center gap-2 border-t border-border px-3 py-2">
        <label htmlFor="terminal-input" className="shrink-0 font-mono text-primary">
          $
        </label>
        <input
          id="terminal-input"
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="help, ls, cat, scan, request, inspect, notes..."
          autoComplete="off"
          spellCheck={false}
          className="w-full bg-transparent font-mono text-xs text-foreground outline-none placeholder:text-muted-foreground/40"
        />
      </form>
    </div>
  );
}
