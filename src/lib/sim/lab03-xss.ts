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
  /** Advanced bypass analysis (see analyzeBypass). */
  bypass?: BypassResult;
}

/**
 * ADVANCED: filter-bypass analysis.
 *
 * A naive blocklist that removes the literal substrings `<script` and `onerror`
 * is trivially defeated. This models the three real bypass families a learner
 * has to reason about:
 *
 *   1. case / whitespace obfuscation   - `<ScRiPt>`, `<script >`
 *   2. entity and encoding tricks      - `&#106;avascript:`, tab/newline splits
 *   3. replacement-pattern sanitizer  - `String.replace(/x/g, '')` re-inserting the
 *                                       match via the `$&` token, so removing
 *                                       the payload rebuilds it
 *
 * Nothing is executed. The result is a description of what a vulnerable page
 * would have done, which is what makes the challenge solvable by reasoning.
 */
export interface BypassResult {
  /** Which families the input exercised. */
  families: Array<"case" | "whitespace" | "entity" | "split" | "replacement" | "none">;
  /** Normalised form after the naive filter ran. */
  afterFilter: string;
  /** True when the naive filter would still be bypassed. */
  bypasses: boolean;
  /** What a vulnerable renderer would finally execute. */
  effective: string;
  notes: string[];
}

/**
 * The naive filter a rushed page actually ships: remove complete <script> blocks
 * and the two most common handler tokens, as literal strings. It reads as
 * sanitisation but operates on text, not on structure.
 *
 * The HTML parser then sees the result and is tolerant of case, stray whitespace
 * and embedded newlines. Because the filter deletes a whole `<script>...</script>`
 * run, a payload that hides a script block *inside* the word it wants rebuilt -
 * `<scri<script>pt>...</scri</script>pt>` - is reassembled into a working tag by
 * the removal itself. That is the bypass.
 */
const NAIVE_BLOCKLIST = [
  // A real "remove script tags" regex, written the way people actually write it.
  /<script\b[^>]*>[\s\S]*?<\/script\s*>/gi,
  /\bon\w+\s*=/gi,
  /\bjavascript\s*:/gi,
];

function applyNaiveFilter(input: string): string {
  let out = input;
  for (const pattern of NAIVE_BLOCKLIST) out = out.replace(pattern, "");
  return out;
}

/**
 * The single-pass filter a vulnerable page actually uses, modelled honestly:
 * remove the literal token, then hand the result to the HTML parser. The parser
 * is tolerant of case, stray whitespace and embedded newlines, so a payload
 * only has to *survive* the string filter to be interpreted. Nested-tag tricks
 * (removal re-inserting the token) are what defeat it.
 */
function survivesNaiveFilter(input: string): boolean {
  const stripped = applyNaiveFilter(input);
  const decoded = decodeEntities(stripped);
  // Collapse the whitespace an HTML parser ignores inside tags and schemes.
  const collapsed = decoded.replace(/[\t\n\r]/g, "");
  return /<\s*script|on\w+\s*=|javascript\s*:/i.test(collapsed);
}

function decodeEntities(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_m, code: string) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_m, code: string) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&colon;/gi, ":")
    .replace(/&tab;/gi, "\t")
    .replace(/&newline;/gi, "\n")
    .replace(/&amp;/gi, "&");
}

export function analyzeBypass(raw: string): BypassResult {
  const input = raw ?? "";
  const families: BypassResult["families"] = [];

  // 1. Case obfuscation: <ScRiPt> / <SCRIPT> defeats a case-sensitive blocklist.
  //    Detected by finding a script tag whose own text is not all-lowercase.
  const scriptTagMatch = /<\s*(\/?\s*script)/i.exec(input);
  if (scriptTagMatch && /[A-Z]/.test(scriptTagMatch[1])) families.push("case");

  // 2. Whitespace / newline inside the tag: <script >, <script\n>, < script>.
  if (/<\s*script\s*[\n\r\t]/i.test(input) || /<\s+script/i.test(input)) {
    families.push("whitespace");
  }
  if (/on\w+\s*=\s*[\n\r\t]|javascript\s*:\s*[\n\r\t]/i.test(input)) {
    families.push("whitespace");
  }

  // 3. Numeric / named entity encoding inside a URI.
  if (/&#x?[0-9a-f]+;|&colon;|&tab;|&newline;/i.test(input)) families.push("entity");

  // 4. Split payloads: java\tscript: or java\nscript:
  if (/java[\s\S]{0,3}script\s*:/i.test(input)) families.push("split");

  // 5. Reassembly: the word "script" split by a nested tag - <scri<script>pt> -
  //    so the filter deletes the inner token and glues the halves back together.
  if (/<\s*scr\s*<\s*script|scri\s*<\s*script/i.test(input)) {
    families.push("replacement");
  }

  if (families.length === 0) families.push("none");

  const afterFilter = applyNaiveFilter(input);
  const decoded = decodeEntities(afterFilter);
  // Whitespace and newlines inside a tag or scheme are ignored by HTML parsers.
  const collapsed = decoded.replace(/[\t\n\r]/g, "");
  const effective = collapsed;
  const bypasses = survivesNaiveFilter(input);

  const notes: string[] = [];
  if (families.includes("case")) {
    notes.push(
      "A case-sensitive blocklist does not match <ScRiPt>. Compare case-insensitively or allow-list instead.",
    );
  }
  if (families.includes("whitespace")) {
    notes.push(
      "HTML parsers tolerate whitespace and newlines inside a tag, so '<script >' is still a script element.",
    );
  }
  if (families.includes("entity")) {
    notes.push(
      "Numeric and named entities are decoded by the parser before the tag is built, so &#106;avascript: becomes javascript:.",
    );
  }
  if (families.includes("split")) {
    notes.push(
      "A tab or newline inside the scheme is stripped before the URI is resolved, so java\\tscript: is still a javascript URI.",
    );
  }
  if (families.includes("replacement")) {
    notes.push(
      "A sanitizer built on String.replace(/payload/g, '') rebuilds the payload when the match is re-inserted. Remove-and-reinsert is not sanitisation.",
    );
  }
  if (bypasses) {
    notes.push(
      `After the naive filter the payload is still live: ${effective.slice(0, 80)}`,
    );
  } else if (families.includes("none")) {
    notes.push("The naive filter removed everything recognisable, or the input was never a payload.");
  }

  return { families, afterFilter, bypasses, effective, notes };
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
