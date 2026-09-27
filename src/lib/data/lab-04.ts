import type { Lab } from "@/lib/types";
import digests from "@/lib/data/flag-digests.json";

const D = digests as Record<string, string>;

export const lab04: Lab = {
  id: "lab-04",
  number: 4,
  title: "The Lost Directory",
  codename: "FILES",
  tagline: "Path traversal, file disclosure, normalisation and containment",
  difficulty: 4,
  difficultyLabel: "Hard",
  xpTotal: 1000,
  target: "Northstar Document Portal",
  brief:
    "Employees download reports from /download?file=. A security review has flagged suspicious file paths. Determine whether users can reach files outside the intended document directory.",
  story: [
    "Northstar's document portal serves quarterly reports, invoices and the employee handbook from a single download endpoint. The parameter is called `file`, and the handler is four lines long.",
    "During a review, an engineer noticed request logs containing paths with `../` in them. The team believes those were mistyped filenames. You are asked to determine whether users can actually read files outside /documents/.",
    "Everything you see in the file browser is a fictional training artefact. TRACE//5 performs no real filesystem access of any kind.",
  ],
  objectives: [
    "Understand what the file parameter controls",
    "Recognise directory traversal and predict the resolved path",
    "Identify the vulnerability class from its evidence",
    "Explain normalisation and containment",
    "State the security invariant that must always hold",
  ],
  concepts: [
    { name: "Path Traversal", klass: "Access Control", coreIdea: "User input changes which file is opened, escaping the intended directory.", defense: "Resolve to a canonical path, then verify it stays inside the allowed root" },
    { name: "Input Normalisation", klass: "Secure Development", coreIdea: "Decode, collapse, and resolve a path before making a security decision on it.", defense: "Allowlists of permitted files, no reliance on stripping sequences" },
  ],
  terminals: ["/documents/", "/internal/"],
  terminal: "docs",
  challenges: [
    {
      id: "L4C1",
      labId: "lab-04",
      index: 1,
      codename: "RECON",
      title: "What does the parameter do?",
      description:
        "Download a legitimate document and inspect the simulated request and response.",
      objective: "What does the `file` parameter control?",
      difficulty: "Easy",
      type: "multiple-choice",
      requiresEvidence: ["lab-04:allowed-download"],
      hints: [
        { level: 1, text: "Compare the value you sent with the artefact you received.", cost: 10 },
        { level: 2, text: "The parameter names a file; the handler appends it to a base directory.", cost: 20 },
        { level: 3, text: "It selects which resource the server retrieves - the filename that is opened.", cost: 30 },
      ],
      learning: {
        what: "GET /download?file=report.pdf causes the server to open /documents/report.pdf and return its contents.",
        why: "A filename parameter is convenient: one endpoint serves every document without a directory per file.",
        danger: "Whoever controls the filename controls which file is opened. If the server does not constrain it, the parameter is a file selector with no limits.",
        discovery: "Read the handler, note how the base directory and the parameter are combined, and test with a value you are allowed to fetch.",
        prevention: "Resolve the final path and confirm it remains inside the permitted root before opening it, or use an allowlist of known documents.",
        testing: "Verify legitimate filenames still work and that any path resolving outside the root is rejected with 403 or 404.",
      },
      code: {
        language: "http",
        vulnerable: "GET /download?file=report.pdf HTTP/1.1\n\nHTTP/1.1 200 OK\nContent-Type: application/pdf\n\n[simulated quarterly report]",
        note: "One endpoint, one parameter, one file. The question is what else that parameter can reach.",
      },
      options: [
        { id: "resource", label: "It selects which resource the server retrieves - the file that gets opened", correct: true, rationale: "The parameter names the file, and the server opens it." },
        { id: "format", label: "It selects the output format of the response", correct: false, rationale: "The content type is determined by the file, not the parameter." },
        { id: "auth", label: "It identifies the user making the request", correct: false, rationale: "Identity comes from the session, not this parameter." },
        { id: "version", label: "It selects a version of the document portal", correct: false, rationale: "No versioning behaviour is present." },
      ],
      flagDigest: D.L4C1,
      xp: 100,
    },
    {
      id: "L4C2",
      labId: "lab-04",
      index: 2,
      codename: "TRAVERSAL",
      title: "Climb out of the directory",
      description:
        "Request a document that sits outside /documents/ using directory traversal syntax. When the simulation reports that the requested path escaped the directory, capture the flag it prints.",
      objective: "Escape /documents/ with a crafted path and capture the flag.",
      difficulty: "Medium",
      type: "flag",
      requiresEvidence: ["lab-04:escape"],
      hints: [
        { level: 1, text: "In a path, `..` means 'the parent directory'. Try ../internal/deployment-notes.txt.", cost: 10 },
        { level: 2, text: "The simulation reports the resolved training path whenever the request escapes /documents/.", cost: 20 },
        { level: 3, text: "Read the response panel after a successful escape and copy the FLAG{...} token.", cost: 30 },
      ],
      learning: {
        what: "A file parameter containing ../ sequences resolves outside /documents/. The simulation reports the resolved training path and returns the requested artefact.",
        why: "Path resolution honours `..` by definition. The handler never checks where the final path ended up.",
        danger: "Arbitrary file disclosure on the host: configuration, source, keys and internal notes are all reachable if the process can read them.",
        discovery: "Submit `../` sequences in any file parameter and watch the resolved path in the response.",
        prevention: "Resolve to a canonical absolute path, then verify containment inside the allowed root before opening. Prefer an allowlist of permitted documents.",
        testing: "Test ../, ..%2f, absolute paths, encoded separators, symlinks and deep sequences; all must be rejected.",
      },
      code: {
        language: "text",
        vulnerable:
          "GET /download?file=../internal/deployment-notes.txt\nresolved: /documents/../internal/deployment-notes.txt  ->  /internal/deployment-notes.txt\nHTTP/1.1 200 OK",
        secure:
          "const root = realpath('/documents')\nconst target = realpath(join(root, userInput))\nif (!target.startsWith(root + '/')) return 403",
        note: "The check must happen after resolution, on the canonical path.",
      },
      options: [],
      flagDigest: D.L4C2,
      xp: 150,
    },
    {
      id: "L4C3",
      labId: "lab-04",
      index: 3,
      codename: "THE EVIDENCE",
      title: "Read what leaked",
      description:
        "The traversal returned a real internal file. Classify the security issue precisely, and capture the flag printed in the disclosure panel.",
      objective: "Classify the issue and capture the evidence flag.",
      difficulty: "Medium",
      type: "flag",
      requiresEvidence: ["lab-04:file-read"],
      hints: [
        { level: 1, text: "Name the flaw: the caller reached a resource outside the intended directory.", cost: 10 },
        { level: 2, text: "The disclosure panel names the class and prints a flag.", cost: 20 },
        { level: 3, text: "Copy the FLAG{...} token from the disclosure panel.", cost: 30 },
      ],
      learning: {
        what: "The endpoint returned a file from /internal/ to a user who should only reach /documents/. This is path traversal leading to arbitrary file disclosure.",
        why: "The server trusted a caller-supplied path component and opened whatever it resolved to, subject only to the process's own filesystem permissions.",
        danger: "Internal notes, configuration and - depending on the stack - source code, keys or process memory can be exposed to any portal user.",
        discovery: "Compare the requested path with the resolved path, and note the HTTP status: a traversal that returns 200 is a successful exploit.",
        prevention: "Canonicalise and confine the path, use an allowlist, run the service with minimal filesystem permissions, and never expose the handler's base directory to user input.",
        testing: "Confirm that every path resolving outside the root returns 403 or 404 with no file content in the body.",
      },
      code: {
        language: "text",
        vulnerable: "content returned: 200 OK, 1.1 KB of internal deployment notes",
        secure: "content returned: 403 Forbidden, no body, no information about existence",
        note: "The status code is part of the finding.",
      },
      options: [],
      flagDigest: D.L4C3,
      xp: 200,
    },
    {
      id: "L4C4",
      labId: "lab-04",
      index: 4,
      codename: "THE FIX",
      title: "Contain the path",
      description:
        "Select every control that belongs in a correct implementation of a file download handler.",
      objective: "Which controls actually contain the requested path?",
      difficulty: "Hard",
      type: "multiple-answer",
      requiresEvidence: ["lab-04:file-read", "lab-04:normalizer"],
      hints: [
        { level: 1, text: "Filtering `..` with a string replace is famously bypassable. Think about when the check must happen.", cost: 10 },
        { level: 2, text: "The decision must be made on the resolved, canonical path - not on the raw input string.", cost: 20 },
        { level: 3, text: "Correct set: resolve the canonical path, verify containment, and use an allowlist. Blacklists of sequences and encoding tricks are not controls.", cost: 30 },
      ],
      learning: {
        what: "A correct handler resolves the requested path to a canonical absolute path, verifies that it is inside the permitted root, and preferably serves from an allowlist of known documents.",
        why: "Sequences can be encoded, doubled, or hidden, so filtering the input is unreliable. The resolved path is unambiguous, so checking it is not.",
        danger: "Blacklist approaches look fixed and are not. One encoding variant or symlink is enough to reopen the hole.",
        discovery: "Test encoding variants (percent-encoding, double encoding, mixed separators), absolute paths and symlinks against the handler.",
        prevention: "Resolve then confine. Use allowlists where the set of documents is known. Run the service with least filesystem privilege as a final layer.",
        testing: "Keep a traversal test suite covering encoded variants, absolute paths, symlinks and null bytes; run it on every release.",
      },
      code: {
        language: "text",
        vulnerable:
          "// Blacklist: bypassable and never complete\nconst safe = input.replace(/\\.\\./g, '')\nconst path = '/documents/' + safe\nread(path)",
        secure:
          "// Allowlist + canonical containment\nconst ROOT = realpath('/documents')\nif (!ALLOWED.has(input)) return 403\nconst target = realpath(join(ROOT, input))\nif (target !== ROOT && !target.startsWith(ROOT + '/')) return 403\nread(target)",
        note: "Filter the decision, not the characters. Decide after resolution.",
      },
      options: [
        { id: "resolve", label: "Resolve the requested path to its canonical absolute form before making any decision.", correct: true },
        { id: "contain", label: "Verify the resolved path is inside the permitted root and reject it otherwise.", correct: true },
        { id: "allowlist", label: "Use an allowlist of permitted documents where the set of files is known.", correct: true },
        { id: "strip", label: "Strip `..` sequences from the input string before using it.", correct: false },
        { id: "encode", label: "Percent-encode the input so traversal characters cannot be sent.", correct: false },
        { id: "basename", label: "Trust the client to send only a filename, with no separators.", correct: false },
      ],
      flagDigest: D.L4C4,
      xp: 250,
    },
    {
      id: "L4F",
      labId: "lab-04",
      index: 5,
      codename: "FINAL",
      title: "State the invariant",
      description:
        "Every containment fix expresses the same rule. State it, then submit the final flag from the assessment panel.",
      objective: "State the security invariant and capture the final flag.",
      difficulty: "Expert",
      type: "flag",
      requiresEvidence: ["lab-04:file-read", "lab-04:normalizer"],
      hints: [
        { level: 1, text: "Write the rule as a sentence that must be true for every single request.", cost: 10 },
        { level: 2, text: "It is about the relationship between the requested file and the permitted directory.", cost: 20 },
        { level: 3, text: "The final flag is in the assessment panel. Search it for FLAG{ after running the path normaliser.", cost: 30 },
      ],
      learning: {
        what: "The invariant is: the resolved, canonical path of the requested file must always remain inside the permitted document directory.",
        why: "Stating the invariant turns a fix into something testable. Every traversal defence is an implementation of this one rule.",
        danger: "Any code path that opens a file without asserting the invariant reintroduces arbitrary file disclosure.",
        discovery: "For every file-serving route in the application, determine what the final resolved path would be for a hostile input.",
        prevention: "Enforce the invariant in one shared, tested function rather than per handler, and fail closed when resolution fails.",
        testing: "Assert the invariant directly in tests: for a corpus of hostile paths, resolved must always be inside the root or the request must be rejected.",
      },
      code: {
        language: "text",
        vulnerable: "resolved = /internal/deployment-notes.txt  ->  outside /documents/  ->  VIOLATION",
        secure: "resolved = /documents/report.pdf             ->  inside /documents/    ->  allowed",
        note: "An invariant is a sentence you can test. Write it down.",
      },
      options: [],
      flagDigest: D.L4F,
      xp: 300,
    },
  ],
  writeUp: {
    overview:
      "Northstar's document portal takes a filename from the request and appends it to a base directory without checking where the result ends up. A user can walk up the directory tree with `../` and download internal files that were never meant to be public.",
    concept:
      "Path traversal is a failure of containment. The parameter looks like a filename, but path resolution gives it meaning: `..` means 'the parent directory'. If the security decision is made on the raw string rather than on the resolved path, the caller controls the destination.",
    solution:
      "Requesting /download?file=../internal/deployment-notes.txt resolves to /internal/deployment-notes.txt and returns 200 OK with its contents. The simulation resolves paths lexically against a table of fictional training artefacts, so no real file is ever touched.",
    whyItWorks:
      "The handler concatenates a base directory with caller input and opens the result. There is no step where the resolved location is compared with the permitted root, so the default answer is 'allow'.",
    remediation:
      "Resolve the requested path to a canonical absolute form, then verify containment inside the permitted root before opening it. Prefer an allowlist of known documents, reject absolute paths, run the service with least filesystem privilege, and log rejected traversal attempts.",
    realWorld:
      "Traversal is one of the oldest web vulnerabilities and is still regularly found, particularly in download handlers, image processors and archive extractors. Combined with source disclosure it often escalates directly to remote code execution.",
    flag: "FLAG{PATHS_SHOULD_STAY_IN_BOUNDS}",
  },
};
