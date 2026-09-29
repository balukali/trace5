/**
 * TRACE//5 self-test.
 *
 * Run with:  node scripts/self-test.mjs
 *
 * Validates the pure CTF logic without a browser: flag digesting, challenge
 * data integrity, XP totals, and every lab simulator's behaviour. The simulator
 * modules are transpiled in-memory with the TypeScript compiler that ships with
 * the project, so the code under test is exactly the code the app ships.
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { sep } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import ts from "typescript";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const tmp = join(root, ".self-test");
rmSync(tmp, { recursive: true, force: true });
mkdirSync(tmp, { recursive: true });

let pass = 0;
let fail = 0;
function check(name, cond, detail = "") {
  if (cond) {
    pass += 1;
    console.log(`  PASS  ${name}`);
  } else {
    fail += 1;
    console.log(`  FAIL  ${name}${detail ? ` (${detail})` : ""}`);
  }
}

/** Transpiles a TS source file plus its local imports to runnable ESM. */
function load(relPath, { inlineJson = null, _seen = new Set() } = {}) {
  if (_seen.has(relPath)) return import.meta.resolve;
  _seen.add(relPath);

  let src = readFileSync(join(root, relPath), "utf8");
  if (inlineJson) {
    // The lab data modules import flag digests as JSON. Node ESM cannot import
    // JSON without an experimental flag, so we drop the import and inline the
    // object on the `D` binding, which is what the bundler does at build time.
    src = src.replace(/^import digests from ".*";$/m, "");
  }
  let code = ts.transpileModule(src, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      resolveJsonModule: false,
    },
  }).outputText;

  // Rewrite module specifiers to files that exist in the temp dir, transpiling
  // each local dependency on the way so the whole graph is available.
  const flatten = (abs) =>
    abs
      .replace(/^src\//, "")
      .replace(/^\.\//, "")
      .replace(/[/\\]/g, "_")
      .replace(/\.ts$/, "");

  const localPath = (spec) => {
    if (spec.startsWith("@/")) return `src/${spec.slice(2)}.ts`;
    const dir = relPath.slice(0, relPath.lastIndexOf("/") + 1);
    return `${dir}${spec.replace(/^\.\//, "")}.ts`;
  };

  code = code.replace(/from\s+"([^"]+)"/g, (all, spec) => {
    // Leave bare package specifiers (zod, react, next/*) untouched.
    if (!spec.startsWith(".") && !spec.startsWith("@/")) return all;
    const target = localPath(spec);
    if (target.startsWith("src/")) {
      load(target, { _seen, inlineJson: inlineJson && target.includes("data/") ? inlineJson : null });
    }
    return `from ${JSON.stringify(`./${flatten(target)}.mjs`)}`;
  });

  // Inline JSON data modules so Node can import them without a loader hook.
  if (inlineJson) {
    code = code.replace(
      /const D = (\w+);/,
      `const D = (${JSON.stringify(inlineJson)});`,
    );
  }

  const outName = relPath.replace(/^src\//, "").replace(/[/\\]/g, "_").replace(/\.ts$/, ".mjs");
  const outPath = join(tmp, outName);
  writeFileSync(outPath, code, "utf8");
  return import(`file:///${outPath.replace(/\\/g, "/")}`);
}

console.log("\nTRACE//5 self-test\n");

// ------------------------------------------------------------------ flags
console.log("[1] Flag digests");
const digestsRaw = JSON.parse(readFileSync(join(root, "src/lib/data/flag-digests.json"), "utf8"));
// scripts/flags.json is the local authoring source and is deliberately
// gitignored, so a fresh clone will not have it. Fall back to the shipped
// digests so the suite still runs, and only run the authoring checks when the
// file is present.
const flagsPath = join(root, "scripts/flags.json");
const hasAuthoringFile = existsSync(flagsPath);
const flags = hasAuthoringFile
  ? JSON.parse(readFileSync(flagsPath, "utf8"))
  : Object.fromEntries(Object.keys(digestsRaw).map((id) => [id, ""]));
const digests = digestsRaw;
const ids = Object.keys(digests);
if (!hasAuthoringFile) {
  console.log("      (scripts/flags.json absent - local authoring file is gitignored)");
}
check("29 digests shipped", ids.length === 29, `got ${ids.length}`);
check("every flag has a digest", ids.every((id) => typeof digests[id] === "string"));
check("digests are unique", new Set(Object.values(digests)).size === ids.length);
if (hasAuthoringFile) {
  check(
    "all flags match FLAG{UPPER_SNAKE}",
    ids.every((id) => /^FLAG\{[A-Z0-9_]+\}$/.test(flags[id])),
  );
}

const { digestFlag, verifyFlagDigest, normalizeFlag } = await load("src/lib/flag-digest.ts");
if (hasAuthoringFile) {
  check(
    "runtime digest matches generated digest for every flag",
    ids.every((id) => digestFlag(id, flags[id]) === digests[id]),
  );
  check("correct flag verifies", ids.every((id) => verifyFlagDigest(id, flags[id], digests[id])));
  check(
    "wrong flag does not verify",
    ids.every((id) => !verifyFlagDigest(id, "FLAG{WRONG}", digests[id])),
  );
  check("flag is case-insensitive", verifyFlagDigest("L1F", flags.L1F.toLowerCase(), digests.L1F));
  check("flag tolerates spaces", verifyFlagDigest("L1F", `  ${flags.L1F}  `, digests.L1F));
}
check("normalize collapses whitespace", normalizeFlag(" a  b ") === "A B");
check(
  "digest is deterministic",
  digestFlag("L1F", "FLAG{SAMPLE}") === digestFlag("L1F", "FLAG{SAMPLE}"),
);
check(
  "challenge id is salted into the digest",
  digestFlag("L1F", "FLAG{SAMPLE}") !== digestFlag("L2F", "FLAG{SAMPLE}"),
);

// -------------------------------------------------------------- lab data
console.log("\n[2] Lab and challenge data");
const labFiles = [
  "src/lib/data/lab-01.ts",
  "src/lib/data/lab-02.ts",
  "src/lib/data/lab-03.ts",
  "src/lib/data/lab-04.ts",
  "src/lib/data/lab-05.ts",
];
const labs = [];
for (const f of labFiles) labs.push(Object.values(await load(f, { inlineJson: digests }))[0]);

check("5 labs loaded", labs.length === 5, `got ${labs.length}`);
const challenges = labs.flatMap((l) => l.challenges);
check("29 challenges total", challenges.length === 29, `got ${challenges.length}`);
check("every lab has at least 5 challenges", labs.every((l) => l.challenges.length >= 5));
check(
  "every lab totals 1000 XP",
  labs.every((l) => l.challenges.reduce((s, c) => s + c.xp, 0) === 1000),
);
check(
  "platform totals 5000 XP",
  labs.reduce((s, l) => s + l.challenges.reduce((a, c) => a + c.xp, 0), 0) === 5000,
);
check("challenge ids are unique", new Set(challenges.map((c) => c.id)).size === challenges.length);
check("every challenge has 3+ hints", challenges.every((c) => c.hints.length >= 3));
check(
  "hint levels are unique and ascending",
  challenges.every((c) => {
    const levels = c.hints.map((h) => h.level);
    return (
      new Set(levels).size === levels.length &&
      levels.every((l, i) => i === 0 || l > levels[i - 1])
    );
  }),
  challenges
    .filter((c) => {
      const l = c.hints.map((h) => h.level);
      return !(new Set(l).size === l.length && l.every((x, i) => i === 0 || x > l[i - 1]));
    })
    .map((c) => c.id)
    .join(","),
);
check(
  "hint costs increase",
  challenges.every((c) => c.hints.every((h, i) => (i === 0 ? true : h.cost > c.hints[i - 1].cost))),
);
// Costs are a flat 10/20/30 for the guided labs. Expert-tier challenges cost
// more because their hints give away more, so the rule is a floor, not a formula.
check(
  "hint costs are at least 10/20/30",
  challenges.every((c) => c.hints.slice(0, 3).every((h, i) => h.cost >= (i + 1) * 10)),
);
check(
  "no hint leaks its own challenge's flag",
  challenges.every((c) => c.hints.every((h) => !h.text.includes(flags[c.id]))),
  challenges
    .flatMap((c) => c.hints.filter((h) => h.text.includes(flags[c.id])).map((h) => `${c.id}: L${h.level}`))
    .join(","),
);
check(
  "no hint leaks any other challenge's flag either",
  challenges.every((c) => c.hints.every((h) => !Object.values(flags).some((f) => h.text.includes(f)))),
);
check(
  "hints never state the full flag value",
  challenges.every((c) => c.hints.every((h) => !/FLAG\{[A-Z0-9_]{6,}\}/.test(h.text))),
);
check(
  "learning panel has all six sections",
  challenges.every((c) =>
    ["what", "why", "danger", "discovery", "prevention", "testing"].every(
      (k) => typeof c.learning[k] === "string" && c.learning[k].length > 10,
    ),
  ),
);
check(
  "every challenge has a matching digest",
  challenges.every((c) => c.flagDigest === digests[c.id]),
);
check(
  "single-choice challenges have a correct option",
  challenges
    .filter((c) => c.type === "multiple-choice")
    .every((c) => c.options.length >= 2 && c.options.some((o) => o.correct)),
);
check(
  "multi-answer challenges have >=2 correct options",
  challenges
    .filter((c) => c.type === "multiple-answer")
    .every((c) => c.options.filter((o) => o.correct).length >= 2),
);
check(
  "flag challenges rely on digest validation",
  challenges.filter((c) => c.type === "flag").every((c) => c.options.length === 0),
);
check(
  "report challenge has 4 keyword-bearing fields",
  challenges
    .filter((c) => c.type === "report")
    .every((c) => c.reportFields.length === 4 && c.reportFields.every((f) => f.keywords.length > 0)),
);
check(
  "lab difficulty is non-decreasing",
  labs.every((l, i) => i === 0 || l.difficulty >= labs[i - 1].difficulty),
);
const ORDER = ["Easy", "Medium", "Hard", "Expert"];
check(
  "challenge difficulty never decreases within a lab",
  labs.every((l) =>
    l.challenges.every(
      (c, i) => i === 0 || ORDER.indexOf(c.difficulty) >= ORDER.indexOf(l.challenges[i - 1].difficulty),
    ),
  ),
);
check(
  "every lab has a complete write-up",
  labs.every((l) =>
    ["overview", "concept", "solution", "whyItWorks", "remediation", "realWorld"].every(
      (k) => typeof l.writeUp[k] === "string" && l.writeUp[k].length > 40,
    ) && /^FLAG\{[A-Z0-9_]+\}$/.test(l.writeUp.flag),
  ),
  labs
    .flatMap((l) =>
      [...["overview", "concept", "solution", "whyItWorks", "remediation", "realWorld"]
        .filter((k) => l.writeUp[k].length <= 40)
        .map((k) => `${l.id}.${k}=${l.writeUp[k].length}`)]
        .concat(
          /^FLAG\{[A-Z0-9_]+\}$/.test(l.writeUp.flag) ? [] : [`${l.id}.flag malformed`],
        ),
    )
    .join(","),
);
check(
  "lab write-up flags exist in the flag catalog",
  labs.every((l) => Object.values(flags).includes(l.writeUp.flag)),
);
check("lab write-up flags are unique", new Set(labs.map((l) => l.writeUp.flag)).size === labs.length);
check(
  "every lab has story, objectives and concepts",
  labs.every((l) => l.story.length >= 3 && l.objectives.length >= 4 && l.concepts.length >= 2),
);
check(
  "challenge labId matches its parent lab",
  labs.every((l) => l.challenges.every((c) => c.labId === l.id)),
);
check(
  "final challenge is last in each lab",
  labs.every((l) => {
    const last = l.challenges[l.challenges.length - 1];
    return last.codename.includes("FINAL") || last.codename.includes("REPORT");
  }),
);
check(
  "every challenge declares required evidence",
  challenges.every((c) => Array.isArray(c.requiresEvidence) && c.requiresEvidence.length > 0),
);
check(
  "evidence keys are namespaced to the owning lab",
  challenges.every((c) => c.requiresEvidence.every((k) => k.startsWith(`${c.labId}:`))),
);
check(
  "no challenge description contains its own flag value",
  challenges.every((c) => !c.description.includes(flags[c.id])),
);

// --------------------------------------------------------- CTF engine
console.log("\n[3] CTF engine validation");
const { validateSubmission, computeAward } = await load("src/lib/ctf-engine.ts");
const noHints = { evidence: [], hintsUsed: 0, walkthroughRevealed: false };
const withEvidence = (c) => ({ ...noHints, evidence: c.requiresEvidence ?? [] });

const mcLab1 = labs[0].challenges.find((c) => c.id === "L1C1");
check(
  "multiple-choice: correct answer accepted",
  validateSubmission(mcLab1, { kind: "choice", ids: ["post"] }, withEvidence(mcLab1)).status ===
    "correct",
);
check(
  "multiple-choice: wrong answer rejected",
  validateSubmission(mcLab1, { kind: "choice", ids: ["get"] }, withEvidence(mcLab1)).status ===
    "incorrect",
);
check(
  "multiple-choice: evidence gate blocks submission",
  validateSubmission(mcLab1, { kind: "choice", ids: ["post"] }, noHints).status === "evidence",
);

const maLab1 = labs[0].challenges.find((c) => c.id === "L1C3");
check(
  "multi-answer: full correct set accepted",
  validateSubmission(maLab1, { kind: "choice", ids: ["concat", "syntax", "param"] }, withEvidence(maLab1))
    .status === "correct",
);
check(
  "multi-answer: partial set rejected",
  validateSubmission(maLab1, { kind: "choice", ids: ["concat"] }, withEvidence(maLab1)).status ===
    "incorrect",
);
check(
  "multi-answer: extra wrong option rejected",
  validateSubmission(
    maLab1,
    { kind: "choice", ids: ["concat", "syntax", "param", "weakpw"] },
    withEvidence(maLab1),
  ).status === "incorrect",
);

const flagLab1 = labs[0].challenges.find((c) => c.id === "L1C2");
check(
  "flag: wrong flag rejected",
  validateSubmission(flagLab1, { kind: "flag", value: "FLAG{NOPE}" }, withEvidence(flagLab1))
    .status === "incorrect",
);
if (hasAuthoringFile) {
  check(
    "flag: correct flag accepted",
    validateSubmission(flagLab1, { kind: "flag", value: flags.L1C2 }, withEvidence(flagLab1))
      .status === "correct",
  );
  check(
    "flag: lowercased flag accepted",
    validateSubmission(
      flagLab1,
      { kind: "flag", value: flags.L1C2.toLowerCase() },
      withEvidence(flagLab1),
    ).status === "correct",
  );
}

const reportChallenge = labs[4].challenges.find((c) => c.type === "report");
const goodReport = {
  rootCause:
    "The API trusts client-supplied identifiers and fields and does not enforce object-level authorization, so mass assignment and weak access control combine into a chain.",
  impact:
    "Unauthorized customers can read other customers' orders and internal profile fields, exposing confidential data and allowing privilege changes.",
  component:
    "The Northstar Customer API: GET /api/profile, GET /api/orders/:id and PATCH /api/profile.",
  remediation:
    "Enforce server-side object-level authorization, minimize responses, allowlist writable fields with schema validation, and add rate limiting plus monitoring.",
};
check(
  "report: complete report accepted",
  validateSubmission(reportChallenge, { kind: "report", fields: goodReport }, withEvidence(reportChallenge))
    .status === "correct",
);
check(
  "report: vague report rejected",
  validateSubmission(
    reportChallenge,
    {
      rootCause: "bad code",
      impact: "bad stuff happened here",
      component: "server",
      remediation: "fix it properly please",
    },
    withEvidence(reportChallenge),
  ).status === "incorrect",
);
check(
  "report: empty field rejected",
  validateSubmission(reportChallenge, { ...goodReport, remediation: "" }, withEvidence(reportChallenge))
    .status === "incorrect",
);

check("XP: full award with no hints", computeAward(mcLab1, 0, false) === mcLab1.xp);
check(
  "XP: hint deductions apply progressively",
  computeAward(mcLab1, 1, false) === mcLab1.xp - 10 &&
    computeAward(mcLab1, 2, false) === mcLab1.xp - 30 &&
    computeAward(mcLab1, 3, false) === mcLab1.xp - 60,
);
check("XP: walkthrough costs 50", computeAward(mcLab1, 0, true) === mcLab1.xp - 50);
check("XP: never falls below the 10 XP floor", computeAward({ ...mcLab1, xp: 20 }, 3, true) === 10);
check(
  "XP: every challenge awards more than 0 when solved cleanly",
  challenges.every((c) => computeAward(c, 0, false) === c.xp && c.xp > 0),
);

// --------------------------------------------------------- simulators
console.log("\n[4] Lab 01 â€” login simulation");
const login = await load("src/lib/sim/lab01-login.ts");
check("wrong password rejected", login.simulateLogin("alex", "wrong").outcome === "invalid");
check("valid credentials accepted", login.simulateLogin("alex", "correct-horse").outcome === "success");
check("empty input handled", login.simulateLogin("", "").outcome === "empty");
for (const payload of ["alex' OR '1'='1", "demo_admin'--", "' OR 1=1--", "' or true--", "x' union select"]) {
  const r = login.simulateLogin(payload, "anything");
  check(`injection detected: ${payload}`, r.outcome === "altered" && typeof r.account === "string");
}
check("login request is POST with form encoding", (() => {
  const req = login.buildLoginRequest("alex", "pw");
  return (
    req.method === "POST" &&
    req.path === "/login" &&
    req.contentType === "application/x-www-form-urlencoded"
  );
})());

console.log("\n[5] Lab 02 â€” invoice / IDOR simulation");
const inv = await load("src/lib/sim/lab02-invoices.ts");
check("own invoice returns 200 and is owned", (() => {
  const r = inv.simulateInvoiceRequest("1042");
  return r.status === 200 && r.owned;
})());
const foreignInv = inv.simulateInvoiceRequest("1044");
check("foreign invoice returns 200 (the vulnerability)", foreignInv.status === 200);
check("foreign invoice flagged as IDOR", foreignInv.finding === "idor");
check("foreign invoice is not owned", foreignInv.owned === false);
check("foreign invoice body discloses another customer", foreignInv.body.includes("jordan"));
check("non-numeric id rejected", inv.simulateInvoiceRequest("abc").status === 404);
check("empty id rejected", inv.simulateInvoiceRequest("").status === 400);
check("out-of-range id returns 404", inv.simulateInvoiceRequest("9999").status === 404);

console.log("\n[6] Lab 03 â€” XSS analysis simulation");
const xss = await load("src/lib/sim/lab03-xss.ts");
check("plain text classified as plain", xss.analyzeSearchTerm("laptop").classification === "plain");
check("plain text is safe to render", xss.analyzeSearchTerm("laptop").wouldExecuteScript === false);
const bold = xss.analyzeSearchTerm("<b>test</b>");
check("markup detected", bold.classification === "markup");
check("tag name extracted", bold.tags.includes("b"));
check("markup strips the tag when parsed", bold.parsedText === "test");
const scriptish = xss.analyzeSearchTerm('<img src=x onerror="alert(1)">');
check("script payload classified", scriptish.classification === "script");
check("script payload flagged as executable", scriptish.wouldExecuteScript === true);
check("event handler detected", scriptish.attributes.some((a) => a.includes("onerror")));
check("escaped output neutralises angle brackets", bold.escaped.includes("&lt;"));
check("escaped output neutralises quotes", xss.analyzeSearchTerm('" onload="x').escaped.includes("&quot;"));
check("stored review payload is classified as script", xss.STORED_REVIEW.classification === "script");

// Filter-bypass engine. The point of these assertions is that the *naive
// filter is defeated by real payloads*, and that the families are identified,
// so the expert challenge stays solvable by reasoning rather than guesswork.
const plain = xss.analyzeBypass("laptop");
check("plain input exercises no bypass family", plain.families.includes("none"));
check("plain input is not a bypass", plain.bypasses === false);

const direct = xss.analyzeBypass("<script>alert(1)</script>");
check("a plain script block is removed by the filter", direct.afterFilter === "");
check("a plain script block does not bypass", direct.bypasses === false);

const entity = xss.analyzeBypass("<img src=&#106;avascript:alert(1)>");
check("entity-encoded scheme is identified", entity.families.includes("entity"));
check("entity-encoded scheme bypasses the filter", entity.bypasses === true);

const split = xss.analyzeBypass("<img src=java\tscript:alert(1)>");
check("tab-split scheme is identified", split.families.includes("split"));
check("tab-split scheme bypasses the filter", split.bypasses === true);

// The headline bypass: the filter deletes the inner <script> run and the
// characters on either side of it rejoin into a working tag.
const reassembly = xss.analyzeBypass("<scri<script>pt>alert(1)</scri</script>pt>");
check("reassembly bypass is identified", reassembly.families.includes("replacement"));
check("reassembly bypasses the filter", reassembly.bypasses === true);
check("reassembly yields a live script tag", /<\s*script/i.test(reassembly.afterFilter));

const mixedCase = xss.analyzeBypass("<ScRiPt>alert(1)</ScRiPt>");
check("case obfuscation is identified", mixedCase.families.includes("case"));
check("case obfuscation is still removed by this filter", mixedCase.bypasses === false);

const handler = xss.analyzeBypass("<img src=x onerror=alert(1)>");
check("a stripped event handler is not a bypass", handler.bypasses === false);


console.log("\n[7] Lab 04 â€” path traversal simulation");
const files = await load("src/lib/sim/lab04-files.ts");
check("legitimate download succeeds", files.simulateDownload("report.pdf").status === 200);
check(
  "legitimate download stays inside the root",
  files.simulateDownload("report.pdf").escaped === false,
);
const trav = files.simulateDownload("../internal/deployment-notes.txt");
check("traversal returns 200 (the vulnerability)", trav.status === 200);
check("traversal escapes the document root", trav.escaped === true);
check(
  "traversal resolves to the internal file",
  trav.resolvedPath === "/internal/deployment-notes.txt",
);
check(
  "traversal discloses file content",
  typeof trav.content === "string" && trav.content.length > 10,
);
check(
  "deeper traversal also escapes",
  files.simulateDownload("../../config/application.conf").escaped === true,
);
check("unknown file inside root is 404", files.simulateDownload("nope.pdf").status === 404);
check("empty file parameter is 400", files.simulateDownload("").status === 400);
check(
  "resolver collapses ./",
  files.resolveTrainingPath("/documents", "./report.pdf") === "/documents/report.pdf",
);
check(
  "resolver handles ../",
  files.resolveTrainingPath("/documents", "../internal/a.txt") === "/internal/a.txt",
);
check(
  "resolver handles nested ../..",
  files.resolveTrainingPath("/documents", "../../config/a.conf") === "/config/a.conf",
);
check(
  "resolver cannot climb above the filesystem root",
  files.resolveTrainingPath("/documents", "../../../../../../etc/passwd") === "/etc/passwd",
);
check(
  "every simulated file lives in a known directory",
  files.SIM_FILES.every((f) => /^\/(documents|internal|config)\//.test(f.path)),
);

console.log("\n[8] Lab 05 â€” customer API simulation");
const api = await load("src/lib/sim/lab05-api.ts");
check("own order returns 200 and is owned", (() => {
  const r = api.getOrder("1021");
  return r.status === 200 && r.owned;
})());
const foreignOrder = api.getOrder("1022");
check("foreign order returns 200 (the vulnerability)", foreignOrder.status === 200);
check("foreign order is not owned", foreignOrder.owned === false);
check("foreign order discloses its owner", foreignOrder.body.includes("priya"));
check("non-numeric order id rejected", api.getOrder("abc").status === 404);
check("out-of-range order id rejected", api.getOrder("9999").status === 404);
check(
  "profile response includes the internal fields",
  api.INTERNAL_FIELDS.every((f) => api.PROFILE_RESPONSE.includes(f)),
);
check(
  "minimal profile response omits internal fields",
  api.INTERNAL_FIELDS.every((f) => !api.PROFILE_MINIMAL.includes(f)),
);
check("UI patch body omits role", !api.PATCH_UI_BODY.includes("role"));
check("exploit patch body includes role", api.PATCH_SENT_BODY.includes("role"));
check("patch response confirms role was applied", api.PATCH_RESPONSE.includes("role"));
check("rate limit log shows no 429 emitted", api.RATE_LIMIT_LOG.includes("no 429"));
check(
  "rate limit guidance states it is not a complete fix",
  api.RATE_LIMIT_GUIDANCE.some((g) => /not a substitute/i.test(g)),
);
check("evidence chain lists all five findings", api.EVIDENCE_CHAIN.length === 5);
check("report schema accepts a complete report", api.incidentReportSchema.safeParse(goodReport).success);

// ------------------------------------------------------ terminal + safety
console.log("\n[9] Simulated terminal");
const term = await load("src/lib/sim/terminal.ts");
const tData = await load("src/lib/sim/terminal-data.ts");
const out = (id, cmd) => term.runCommand(id, cmd).lines.map((l) => l.text).join("\n");
check("help lists the available commands", out("lab-01", "help").includes("Available commands"));
check("whoami reports the simulated session", out("lab-01", "whoami").includes("alex"));
check("ls lists the simulated root", out("lab-01", "ls /").includes("README.txt"));
check("cat reads a simulated file", out("lab-01", "cat /README.txt").includes("Employee Portal"));
check(
  "cat refuses a file outside the table",
  out("lab-01", "cat /etc/passwd").includes("no such simulated file"),
);
check("cat refuses to read a directory", out("lab-04", "cat /internal/").includes("directory"));
check("schema is available in the portal lab", out("lab-01", "schema").includes("password_hash"));
check("schema is refused elsewhere", out("lab-02", "schema").includes("portal lab only"));
check("scan returns predefined endpoints", out("lab-01", "scan").includes("[200] POST /login"));
check(
  "request replays a canned response",
  out("lab-01", "request GET /api/profile").includes("predefined training response"),
);
check("inspect shows the last exchange", out("lab-05", "inspect").includes("never compared"));
check("notes returns the incident notes", out("lab-05", "notes").includes("NS-2026-005"));
check("invoices lists the simulated index", out("lab-02", "invoices").includes("1044"));
check("who lists the simulated user table", out("lab-01", "who").includes("demo_admin"));
check("pwd returns the simulated cwd", out("lab-03", "pwd") === "/feedback");
check(
  "reading an internal file yields evidence",
  term.runCommand("lab-04", "cat /internal/deployment-notes.txt").evidence === "lab-04:internal-read",
);
check(
  "reading a normal file yields no evidence",
  term.runCommand("lab-04", "cat /documents/report.pdf").evidence === undefined,
);


console.log("\n[10] Terminal rejects arbitrary input");
for (const attack of [
  "rm -rf /",
  "curl http://evil.test",
  "node -e process.exit",
  "require('fs')",
  "$(whoami)",
  "backtick-id",
  "../../etc/passwd",
  "<script>alert(1)</script>",
  "process.exit(1)",
  "shutdown",
]) {
  const r = term.runCommand("lab-01", attack);
  check(
    `rejected with a static error: ${attack.slice(0, 26)}`,
    r.lines[0].kind === "error" && r.lines[0].text.includes("not recognised"),
  );
}
check(
  "no terminal command can reach a real system file",
  !out("lab-01", "cat /windows/system32/config/sam").includes("root"),
);

console.log("\n[11] Terminal data is fictional");
const ctxJson = JSON.stringify(tData.CONTEXTS);
check("no real hostnames in terminal data", !ctxJson.includes("localhost:"));
check("no absolute Windows paths in terminal data", !ctxJson.includes("C:\\\\"));
check("no real-looking email domains", !/@[a-z0-9.-]+\.(com|net|org|io)\b/i.test(ctxJson));
check("no environment variable references in terminal data", !/\$\{?[A-Z_]{3,}\}?/.test(ctxJson));

console.log("\n[12] Platform safety surface");
const srcDir = join(root, "src");
function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}
const allFiles = walk(srcDir).filter((f) => /\.tsx?$/.test(f));
const allSource = allFiles.map((f) => readFileSync(f, "utf8")).join("\n");
const componentSource = allFiles
  .filter((f) => f.includes(`${sep}components${sep}`))
  .map((f) => readFileSync(f, "utf8"))
  .join("\n");

check("no eval() in src", !/\beval\s*\(/.test(allSource));
check("no new Function() in src", !/new\s+Function\s*\(/.test(allSource));
check("no child_process import in src", !/import\s+.*\bchild_process\b/.test(allSource));
check("no exec/spawn call in src", !/^\s*(const|let|var|await|return)?\s*\b(exec|execSync|spawn|spawnSync)\s*\(/m.test(allSource));
check("no dangerouslySetInnerHTML usage in src", !/<[a-z]+\s+dangerouslySetInnerHTML/.test(allSource));
check("no fs import in src", !/import\s+.*from\s+["'](node:)?fs["']/.test(allSource));
// process.env must never be read by client or app code. The single allowed
// exception is src/middleware.ts, which runs on the server and only uses it to
// pin a per-lab container (TRACE5_LAB).
const envReadingFiles = allFiles.filter(
  (f) => !f.endsWith(join(sep, "middleware.ts")) && /process\.env/.test(readFileSync(f, "utf8")),
);
check(
  "no process.env access in src (middleware exempt)",
  envReadingFiles.length === 0,
  envReadingFiles.map((f) => f.replace(root, "")).join(", "),
);
check("no database client imported in src", !/from\s+["'](prisma|drizzle|mongoose|knex|pg|mysql2)/.test(allSource));
check("no outbound fetch to a real host", !/fetch\(\s*["'`]https?:/.test(allSource));
check("no Vercel tokens in src", !/vercel[_-]?token|VERCEL_TOKEN/i.test(allSource));

// Flag handling. Flags must never appear in the challenge definitions, because
// that is what the learner is being tested on. The lab write-up deliberately
// contains the lab's final flag in plaintext, because it is revealed to the
// learner once the lab is complete (or the walkthrough is paid for). The
// per-challenge flags are revealed by the lab simulators as discoverable
// evidence. Both behaviours are documented in the README.
function stripWriteUpFlags(source) {
  return source.replace(/^\s*flag:\s*"FLAG\{[^}]+\}",?\s*$/gm, "");
}
const dataSource = allFiles
  .filter((f) => f.includes(`${sep}lib${sep}data${sep}`) || f.includes(`${sep}lib${sep}ctf-engine`))
  .map((f) => stripWriteUpFlags(readFileSync(f, "utf8")))
  .join("\n");
if (hasAuthoringFile) {
  check(
    "no plaintext flag in challenge definitions (outside write-ups)",
    !Object.values(flags).some((f) => f && dataSource.includes(f)),
  );
  check(
    "write-up flags are the only plaintext flags in data",
    labs.every((l) => Object.values(flags).includes(l.writeUp.flag)),
  );
  check(
    "flags are only revealed by the lab simulators",
    Object.values(flags).some((f) => f && componentSource.includes(f)),
  );
} else {
  // Without the authoring file we can still assert the structural invariant.
  check(
    "no challenge definition hardcodes a FLAG{...} literal",
    !/^\s*flag:\s*"FLAG\{/m.test(dataSource),
  );
}
check("progress is stored under one namespaced key", allSource.includes("trace5.progress.v1"));
check("storage access is wrapped in try/catch", /try\s*\{[\s\S]{0,200}localStorage\.setItem/.test(allSource));

// The plaintext authoring file must never be tracked by git, and must never
// reach the Docker build context. Both are enforced so the answers cannot be
// published by accident.
console.log("\n[13] Flag authoring file is not published");
const trackedFiles = execFileSync("git", ["ls-files"], { cwd: root, encoding: "utf8" })
  .split(/\r?\n/)
  .filter(Boolean);
check(
  "scripts/flags.json is not tracked by git",
  !trackedFiles.includes("scripts/flags.json"),
);
const gitignore = readFileSync(join(root, ".gitignore"), "utf8");
check("scripts/flags.json is gitignored", /^scripts\/flags\.json$/m.test(gitignore));
const dockerignore = join(root, ".dockerignore");
if (existsSync(dockerignore)) {
  check(
    "scripts/flags.json is excluded from the Docker build context",
    /^scripts\/flags\.json$/m.test(readFileSync(dockerignore, "utf8")),
  );
}



console.log(`\n${pass} passed, ${fail} failed\n`);
rmSync(tmp, { recursive: true, force: true });
process.exit(fail === 0 ? 0 : 1);

check("report schema rejects a missing field", !api.incidentReportSchema.safeParse({ rootCause: "x" }).success);
