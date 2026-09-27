/**
 * LAB 04 SIMULATOR - simulated document portal file browser.
 *
 * SECURITY: no filesystem call is ever made. The "filesystem" below is a plain
 * JavaScript object of fictional training artefacts. The resolver performs
 * purely lexical normalisation so the learner can *see* why "../" escapes a
 * directory, and then returns a canned response.
 */

export interface SimFile {
  path: string;
  kind: "document" | "internal" | "config";
  content: string;
  size: string;
}

export const SIM_FILES: SimFile[] = [
  { path: "/documents/report.pdf", kind: "document", size: "412 KB", content: "[binary training artefact] Northstar quarterly report (simulated)" },
  { path: "/documents/invoice.pdf", kind: "document", size: "188 KB", content: "[binary training artefact] Invoice batch 2026-02 (simulated)" },
  { path: "/documents/handbook.pdf", kind: "document", size: "1.2 MB", content: "[binary training artefact] Employee handbook (simulated)" },
  { path: "/documents/payroll-summary.pdf", kind: "document", size: "96 KB", content: "[binary training artefact] Payroll summary (simulated)" },
  {
    path: "/internal/deployment-notes.txt",
    kind: "internal",
    size: "1.1 KB",
    content:
      "Northstar deployment notes\nEnvironment: production\nInternal service: training-api\nDebug: enabled\nKey rotation: 2026-03-01",
  },
  {
    path: "/internal/security-review.txt",
    kind: "internal",
    size: "0.8 KB",
    content:
      "SECURITY REVIEW (internal)\nFinding: /download accepts a file parameter.\nStatus: accepted risk - reporter left the company.\nNote: no path containment check observed.",
  },
  {
    path: "/config/application.conf",
    kind: "config",
    size: "0.4 KB",
    content:
      "[server]\ndocs_root = /documents\ninternal = /internal\nconfig = /config\n[security]\nallow_traversal = true   # legacy flag, still enabled",
  },
];

export const DOCS_ROOT = "/documents";

export interface DownloadResponse {
  requestLine: string;
  status: number;
  statusText: string;
  escaped: boolean;
  resolvedPath: string;
  content?: string;
  size?: string;
  classification: "allowed" | "traversal" | "not-found";
  observations: string[];
  evidence?: string;
}

/** Lexical resolution: no disk access, no symlinks, no OS calls. */
export function resolveTrainingPath(base: string, input: string): string {
  const combined = `${base}/${input}`;
  const parts: string[] = [];
  for (const segment of combined.split("/")) {
    if (!segment || segment === ".") continue;
    if (segment === "..") {
      parts.pop();
      continue;
    }
    parts.push(segment);
  }
  return `/${parts.join("/")}`;
}

export function simulateDownload(fileParam: string): DownloadResponse {
  const raw = (fileParam ?? "").trim();
  const requestLine = `GET /download?file=${encodeURIComponent(raw) || "<empty>"}`;

  if (!raw) {
    return {
      requestLine,
      status: 400,
      statusText: "Bad Request",
      escaped: false,
      resolvedPath: DOCS_ROOT,
      classification: "not-found",
      observations: ["The file parameter is required."],
    };
  }

  const resolved = resolveTrainingPath(DOCS_ROOT, raw);
  const match = SIM_FILES.find((f) => f.path === resolved);
  const escaped = !resolved.startsWith(`${DOCS_ROOT}/`) && resolved !== DOCS_ROOT;

  if (!match) {
    return {
      requestLine,
      status: 404,
      statusText: "Not Found",
      escaped,
      resolvedPath: resolved,
      classification: escaped ? "traversal" : "not-found",
      observations: escaped
        ? [
            "The requested path escaped /documents/ but no simulated artefact matched.",
            "The handler reported 404 without complaining about the traversal itself - that is the bug.",
          ]
        : ["The resolved path stayed inside /documents/, but no artefact matched."],
      evidence: escaped ? "lab-04:escape" : undefined,
    };
  }

  const classification = match.kind === "document" ? "allowed" : "traversal";

  return {
    requestLine,
    status: 200,
    statusText: "OK",
    escaped: classification === "traversal",
    resolvedPath: match.path,
    content: match.content,
    size: match.size,
    classification,
    observations:
      classification === "allowed"
        ? [
            "The handler served a document from inside the permitted directory.",
            "This is the intended behaviour of /download.",
          ]
        : [
            `Requested path escapes ${DOCS_ROOT}/.`,
            `Resolved training path: ${match.path}`,
            "The handler returned 200 OK for a file the caller was never meant to reach.",
          ],
    evidence: classification === "traversal" ? "lab-04:file-read" : undefined,
  };
}

export const TRAVERSAL_SUGGESTIONS = [
  "report.pdf",
  "../internal/deployment-notes.txt",
  "../../config/application.conf",
];
