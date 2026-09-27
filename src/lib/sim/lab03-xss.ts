/**
 * LAB 03 SIMULATOR - simulated feedback search + stored reviews.
 *
 * SECURITY: the real TRACE//5 application NEVER renders learner input as HTML.
 * React escapes every value it renders, and this module never uses
 * dangerouslySetInnerHTML. Instead it *analyses* the input with literal string
 * operations and reports what a vulnerable browser would have done. No
 * JavaScript from a learner is ever executed.
 */

export interface AnalysisResult {
  /** Text as it would appear after HTML parsing (tags removed, entities kept). */
  parsedText: string;
  /** Tag names detected in the input. */
  tags: string[];
  /** Attribute names detected. */
  attributes: string[];
  /** Whether the payload would run script in a vulnerable renderer. */
  wouldExecuteScript: boolean;
  /** Safe HTML-escaped rendering of the input. */
  escaped: string;
  /** Human explanation of the simulated rendering. */
  interpretation: string[];
  classification: "plain" | "markup" | "attribute" | "script";
  evidence?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const SCRIPT_MARKERS = ["<script", "javascript:", "onerror", "onload", "onclick", "onfocus"];
const ATTR_PATTERN = /\bon[a-z]+\s*=/gi;

export function analyzeSearchTerm(raw: string): AnalysisResult {
  const input = raw ?? "";
  const lower = input.toLowerCase();
  const tags = Array.from(input.matchAll(/<\s*\/?\s*([a-z0-9]+)/gi)).map((m) =>
    m[1].toLowerCase(),
  );
  const attributes = Array.from(input.matchAll(ATTR_PATTERN)).map((m) =>
    m[0].replace(/\s*=$/, "").toLowerCase(),
  );
  const wouldExecuteScript = SCRIPT_MARKERS.some((m) => lower.includes(m));

  const parsedText = input
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();

  let classification: AnalysisResult["classification"] = "plain";
  if (wouldExecuteScript) classification = "script";
  else if (attributes.length) classification = "attribute";
  else if (tags.length) classification = "markup";

  const interpretation: string[] = [];
  if (classification === "plain") {
    interpretation.push(
      "No markup detected. The value is rendered exactly as typed, because plain text has no special meaning in HTML.",
    );
  } else if (classification === "markup") {
    interpretation.push(
      `A vulnerable renderer would parse <${tags[0]}> as a real element, not as text.`,
      "The visible text changes and the document structure changes - that is markup being interpreted.",
      "TRACE//5 shows you the interpretation as a description. The real page would have built DOM nodes here.",
    );
  } else if (classification === "attribute") {
    interpretation.push(
      `The payload tries to break out of an attribute using an event handler (${attributes.join(", ")}).`,
      "In a vulnerable renderer this becomes executable code, not text.",
    );
  } else {
    interpretation.push(
      "A script-bearing payload was detected (script tag, javascript: URI, or inline event handler).",
      "In a real vulnerable page this would execute JavaScript in the visitor's session.",
      "TRACE//5 deliberately does NOT execute it - the simulation only classifies the payload.",
    );
  }

  return {
    parsedText: parsedText || "(nothing visible)",
    tags: Array.from(new Set(tags)),
    attributes: Array.from(new Set(attributes)),
    wouldExecuteScript,
    escaped: escapeHtml(input),
    interpretation,
    classification,
    evidence: classification === "plain" ? undefined : "lab-03:markup",
  };
}

export interface ReviewRecord {
  id: number;
  author: string;
  product: string;
  rating: number;
  body: string;
  classification: "safe" | "markup" | "script";
}

export const SIMULATED_REVIEWS: ReviewRecord[] = [
  {
    id: 501,
    author: "priya",
    product: "Latitude 14 Ultrabook",
    rating: 5,
    body: "Battery life is genuinely excellent. Two full workdays on one charge.",
    classification: "safe",
  },
  {
    id: 502,
    author: "dev-team",
    product: "Latitude 14 Ultrabook",
    rating: 1,
    body: "<b>Refund never arrived</b> after 6 weeks. Support closed my ticket without replying.",
    classification: "markup",
  },
  {
    id: 503,
    author: "riley",
    product: "Meridian 27 Monitor",
    rating: 4,
    body: "Great colour accuracy. The stand is wobbly though.",
    classification: "safe",
  },
];

export const STORED_REVIEW = {
  id: 777,
  author: "jordan",
  product: "Meridian 27 Monitor",
  rating: 1,
  body: "<img src=x onerror=\"training-simulation-alert\"> total scam, reporting this store",
  classification: "script" as const,
};

export const STORED_REVIEW_NOTES = [
  "This review was submitted earlier and is stored in the database.",
  "It is now rendered for EVERY visitor of the product page, not just the author.",
  "That is the difference: reflected XSS returns in one response, stored XSS returns to every later visitor.",
];
