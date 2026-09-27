import type { LabId } from "@/lib/types";

/**
 * Predefined simulated shell data for TRACE//5.
 *
 * Everything here is fictional training content. No real host, filesystem,
 * database or network target is referenced.
 */

export interface TerminalContext {
  banner: string;
  cwd: string;
  files: Record<string, string[]>;
  contents: Record<string, string>;
  endpoints: string[];
  notes: string[];
}

export const PORTAL_SCHEMA = `users
├─ id            integer      primary key
├─ username      varchar(64)  unique
├─ password_hash varchar(255) bcrypt
├─ role          varchar(32)  default 'customer'
└─ email         varchar(255)`;

export const PORTAL_ACCOUNTS = [
  { id: 1, username: "alex", role: "customer" },
  { id: 2, username: "jordan", role: "customer" },
  { id: 7, username: "demo_admin", role: "admin" },
];

export const INVOICES = [
  { invoice_id: 1042, customer: "alex", amount: 1299, status: "paid" },
  { invoice_id: 1043, customer: "alex", amount: 249, status: "open" },
  { invoice_id: 1044, customer: "jordan", amount: 8750, status: "open" },
  { invoice_id: 1045, customer: "jordan", amount: 430, status: "paid" },
  { invoice_id: 1046, customer: "sam", amount: 2210, status: "refunded" },
  { invoice_id: 1047, customer: "riley", amount: 65, status: "open" },
];

export const HELP = `trace - simulated investigation shell (training environment)
This shell replays predefined Northstar Systems training data.
No real system commands are executed.

Available commands:
  help                     show this help
  ls [path]                list simulated directory contents
  cat <file>               read a simulated file
  scan                     run the predefined endpoint scan
  request <METHOD> <path>  replay a simulated HTTP request
  inspect                  show the last request/response pair
  schema                   dump the simulated database schema
  invoices                 list the simulated invoice index
  who                      list the simulated user table
  notes                    read the incident notes
  whoami                   show the simulated session identity
  pwd                      show the simulated working directory
  clear                    clear the terminal`;

const PORTAL_FILES: Record<string, string[]> = {
  "/": ["login", "README.txt", "config/"],
  "/config/": ["application.conf", "db-notes.txt"],
};

const PORTAL_CONTENTS: Record<string, string> = {
  "/README.txt":
    "Northstar Employee Portal v2.4 (post-migration build).\nLogin is handled by POST /login. See config/application.conf for auth notes.",
  "/config/application.conf":
    "[auth]\nprovider = legacy-direct-query\nsession = cookie:ns_portal\nnotes = MIGRATED 2026-01 - direct query still wired up",
  "/config/db-notes.txt":
    "Reminder: the login handler still concatenates request fields into the\nusers lookup. Flagged in ticket SEC-114 but never scheduled.",
};

const DOC_FILES = ["report.pdf", "invoice.pdf", "handbook.pdf", "payroll-summary.pdf"];
const INTERNAL_FILES = ["deployment-notes.txt", "security-review.txt"];
const CONFIG_FILES = ["application.conf"];

export const CONTEXTS: Record<LabId, TerminalContext> = {
  "lab-01": {
    banner: "Northstar Employee Portal - investigation shell",
    cwd: "portal",
    files: PORTAL_FILES,
    contents: PORTAL_CONTENTS,
    endpoints: ["POST /login", "GET /session", "POST /logout"],
    notes: [
      "SEC-114: login handler builds its credential query by string concatenation.",
      "Migrated 2026-01-09 from the legacy intranet. Auth tests were skipped.",
      "A demo_admin account exists for the internal demo tenant.",
    ],
  },
  "lab-02": {
    banner: "Northstar Customer Portal - API investigation shell",
    cwd: "portal",
    files: { "/": ["invoices/", "README.txt"] },
    contents: {
      "/README.txt":
        "Customer portal API.\nInvoices are addressed by a numeric invoice_id.\nAccess rules are enforced per-request by the API.",
    },
    endpoints: ["GET /api/invoices/1042", "GET /api/invoices/1044", "GET /api/session"],
    notes: [
      "The invoice handler looks the object up, then returns it.",
      "Support confirmed: 'customers can only see their own invoices'.",
    ],
  },
  "lab-03": {
    banner: "Northstar Feedback Portal - investigation shell",
    cwd: "feedback",
    files: { "/": ["reviews/", "README.txt"] },
    contents: {
      "/README.txt":
        "Feedback portal. Search echoes the submitted term into the results banner,\nand customer reviews are stored and rendered for every visitor.",
    },
    endpoints: ["GET /search?q=laptop", "GET /reviews", "POST /reviews"],
    notes: [
      "The results banner is built with innerHTML for legacy styling reasons.",
      "Review content is rendered unescaped on the public product page.",
    ],
  },
  "lab-04": {
    banner: "Northstar Document Portal - investigation shell",
    cwd: "docs",
    files: {
      "/documents/": DOC_FILES,
      "/internal/": INTERNAL_FILES,
      "/config/": CONFIG_FILES,
    },
    contents: {
      "/documents/report.pdf": "[binary training artefact] Northstar quarterly report (simulated)",
      "/documents/invoice.pdf": "[binary training artefact] Invoice batch 2026-02 (simulated)",
      "/documents/handbook.pdf": "[binary training artefact] Employee handbook (simulated)",
      "/documents/payroll-summary.pdf": "[binary training artefact] Payroll summary (simulated)",
      "/internal/deployment-notes.txt":
        "Northstar deployment notes\nEnvironment: production\nInternal service: training-api\nDebug: enabled\nKey rotation: 2026-03-01",
      "/internal/security-review.txt":
        "SECURITY REVIEW (internal)\nFinding: /download accepts a file parameter.\nStatus: accepted risk - reporter left the company.\nNote: no path containment check observed.",
      "/config/application.conf":
        "[server]\ndocs_root = /documents\ninternal = /internal\nconfig = /config\n[security]\nallow_traversal = true   # legacy flag, still enabled",
    },
    endpoints: ["GET /download?file=report.pdf"],
    notes: [
      "Document portal migrated from a legacy file server in 2019.",
      "The download handler concatenates docs_root with the file parameter.",
    ],
  },
  "lab-05": {
    banner: "Northstar Customer API - incident response shell",
    cwd: "capi",
    files: { "/": ["README.txt", "logs/"] },
    contents: {
      "/README.txt":
        "Incident NS-2026-005. Multiple low-severity findings on the customer API.\nNo single alert looked critical.",
      "/logs/api-access.log": [
        "09:41:02 GET  /api/profile     200 (alex)",
        "09:41:05 GET  /api/orders      200 (alex)",
        "09:41:07 GET  /api/orders/1021 200 (alex)",
        "09:41:07 GET  /api/orders/1022 200 (alex)   <-- owner: priya",
        "09:41:09 GET  /api/orders/1023 200 (alex)   <-- owner: dev-team",
        "09:41:12 PATCH /api/profile    200 (alex) body=[name,email,role]",
        "09:41:14 GET  /api/orders/1024 200 (alex)",
        "09:41:16 GET  /api/orders/1025 200 (alex)",
        "09:41:18 GET  /api/orders/1026 200 (alex)",
        "note: 100 requests / 10s from one source, no throttling observed",
      ].join("\n"),
    },
    endpoints: ["/api/profile", "/api/orders", "/api/notifications", "/api/orders/1021"],
    notes: [
      "NS-2026-005: alert volume was low, but the request pattern was automated.",
      "The frontend renders name and email only, yet the API returns more fields.",
      "Object identifiers are sequential integers with no ownership check.",
      "PATCH /api/profile accepted a role field that the UI never sends.",
    ],
  },
};

