/**
 * SIMULATED TERMINAL PARSER
 * ------------------------
 * Parses learner input against a FIXED, PREDEFINED command table.
 *
 * SECURITY: there is no `eval`, no `Function` constructor, no `child_process`,
 * no filesystem access and no dynamic import of user-controlled strings. Input
 * is split with a fixed regex, lower-cased, and matched against static records.
 * Anything unrecognised returns a static error. Behaviour is deterministic.
 */

import type { LabId } from "@/lib/types";
import {
  CONTEXTS,
  HELP,
  INVOICES,
  PORTAL_ACCOUNTS,
  PORTAL_SCHEMA,
  type TerminalContext,
} from "./terminal-data";

export interface TerminalLine {
  id: string;
  kind: "input" | "output" | "error" | "system" | "success";
  text: string;
}

export interface TerminalResult {
  lines: Omit<TerminalLine, "id">[];
  evidence?: string;
}

type Lines = TerminalResult["lines"];

const out = (text: string): Lines => [{ kind: "output", text }];
const err = (text: string): Lines => [{ kind: "error", text }];

/** Fixed tokenizer: splits on whitespace, strips quotes, caps at 4 tokens. */
function tokenize(input: string): string[] {
  return input
    .trim()
    .split(/\s+/)
    .map((t) => t.replace(/^["']|["']$/g, ""))
    .slice(0, 4);
}

/**
 * Purely lexical path cleanup used only to index the static listing table.
 * Returns a trailing slash for directories so they can be looked up in the
 * `files` table, and no trailing slash for files so they can be looked up in
 * the `contents` table.
 */
function normalizePath(p: string, asDirectory = false): string {
  const parts: string[] = [];
  for (const part of p.split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") {
      parts.pop();
      continue;
    }
    parts.push(part);
  }
  if (!parts.length) return "/";
  return asDirectory || !parts[parts.length - 1].includes(".") ? `/${parts.join("/")}/` : `/${parts.join("/")}`;
}

export function terminalBanner(labId: LabId): string {
  return CONTEXTS[labId].banner;
}

export function runCommand(labId: LabId, rawInput: string): TerminalResult {
  const ctx: TerminalContext = CONTEXTS[labId];
  const tokens = tokenize(rawInput);
  const cmd = (tokens[0] ?? "").toLowerCase();

  if (!cmd) return { lines: err("no command supplied") };

  switch (cmd) {
    case "help":
    case "?":
      return { lines: out(HELP) };

    case "clear":
      return { lines: [{ kind: "system", text: "__CLEAR__" }] };

    case "pwd":
      return { lines: out(`/${ctx.cwd}`) };

    case "whoami":
      return {
        lines: out(
          "session: alex@portal.northstar.test\nrole: customer\nscope: own records only (claimed by the vendor)",
        ),
        evidence: `${labId}:whoami`,
      };

    case "ls": {
      const target = normalizePath(tokens[1] ?? "/", true);
      const files = ctx.files[target];
      if (!files) {
        return { lines: err(`ls: cannot access '${target}': not present in the simulated table`) };
      }
      return { lines: out(`simulated listing of ${target}:\n  ${files.join("\n  ")}`) };
    }

    case "cat": {
      const file = normalizePath(tokens[1] ?? "");
      const body = ctx.contents[file];
      if (body === undefined) {
        if (ctx.files[file]) return { lines: err(`cat: ${file} is a simulated directory`) };
        return {
          lines: err(
            `cat: ${file}: no such simulated file. Try: ls / , ls /documents , ls /internal`,
          ),
        };
      }
      const isSensitive = file.startsWith("/internal") || file.startsWith("/config");
      return {
        lines: out(body),
        evidence: isSensitive ? `${labId}:internal-read` : undefined,
      };
    }

    case "scan":
      return {
        lines: out(
          `simulated scan - target: ${ctx.banner}\n` +
            `${ctx.endpoints.map((e) => `  [200] ${e}`).join("\n")}\n` +
            "  [200] /health\n" +
            "  note: every response was served to an authenticated customer session",
        ),
        evidence: `${labId}:scan`,
      };

    case "request": {
      const method = (tokens[1] ?? "GET").toUpperCase();
      const path = tokens[2] ?? "/";
      const known = ctx.endpoints.some((e) => e.includes(path));
      return {
        lines: out(
          `> ${method} ${path}\n< HTTP/1.1 200 OK\n< Content-Type: application/json\n\n` +
            `{\n  "simulated": true,\n  "target": "${path}",\n  "known_endpoint": ${known},\n` +
            `  "note": "predefined training response - no live request was made"\n}`,
        ),
        evidence: `${labId}:request`,
      };
    }

    case "inspect":
      return {
        lines: out(
          "last simulated exchange:\n" +
            "  -> GET /api/orders/1021\n  <- 200 OK\n" +
            "  body: order 1021 was returned to session user 'alex'\n" +
            "  note: the owner field was never compared against the session identity",
        ),
        evidence: `${labId}:inspect`,
      };

    case "schema":
      if (labId !== "lab-01") {
        return { lines: err("schema: the simulated schema is available in the portal lab only") };
      }
      return { lines: out(PORTAL_SCHEMA), evidence: "lab-01:schema" };

    case "notes":
      return {
        lines: out(ctx.notes.map((n, i) => `[${i + 1}] ${n}`).join("\n")),
        evidence: `${labId}:notes`,
      };

    case "who":
      return {
        lines: out(
          "simulated user table:\n" +
            PORTAL_ACCOUNTS.map(
              (a) => `  id=${a.id}  username=${a.username}  role=${a.role}`,
            ).join("\n"),
        ),
        evidence: "lab-01:accounts",
      };

    case "invoices":
      return {
        lines: out(
          "simulated invoice index (fictional training data):\n" +
            INVOICES.map((i) => `  ${i.invoice_id}  ${i.customer}  $${i.amount}  ${i.status}`).join("\n"),
        ),
        evidence: "lab-02:invoices",
      };

    default:
      return {
        lines: err(
          `${cmd}: not recognised. This shell only replays predefined training data - type 'help'.`,
        ),
      };
  }
}

export { HELP };
