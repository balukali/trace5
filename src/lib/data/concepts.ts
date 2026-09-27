import type { ConceptCard, LeaderboardEntry } from "@/lib/types";

/**
 * Concept cards unlock as the learner solves the challenge that teaches them.
 * They are intentionally separate from the labs so the concepts page can be
 * read as a reference library.
 */
export const CONCEPT_CARDS: ConceptCard[] = [
  {
    id: "authentication",
    name: "Authentication",
    klass: "Access Control",
    coreIdea: "Proving who a user is before granting any access. It answers one question: who are you?",
    defense: "Salted password hashing, MFA, generic error messages, rate limiting, secure session handling.",
    unlocksOn: { labId: "lab-01", challengeId: "L1C1" },
  },
  {
    id: "sql-injection",
    name: "SQL Injection",
    klass: "Injection",
    coreIdea: "Untrusted input changes the meaning of a query, so data is executed as code.",
    defense: "Parameterized queries and prepared statements. Never build queries by concatenation.",
    unlocksOn: { labId: "lab-01", challengeId: "L1C2" },
  },
  {
    id: "password-storage",
    name: "Password Storage",
    klass: "Cryptography",
    coreIdea: "Passwords must be stored as salted one-way hashes so a database breach does not become a credential breach.",
    defense: "Argon2id, bcrypt or scrypt with a per-user salt and a tuned work factor.",
    unlocksOn: { labId: "lab-01", challengeId: "L1C4" },
  },
  {
    id: "authorization",
    name: "Authorization",
    klass: "Access Control",
    coreIdea: "Deciding what an authenticated identity is allowed to do. Authentication says who; authorization says what.",
    defense: "Server-side permission checks on every request, deny by default, centralized policy.",
    unlocksOn: { labId: "lab-02", challengeId: "L2C3" },
  },
  {
    id: "idor-bola",
    name: "IDOR / BOLA",
    klass: "Broken Access Control",
    coreIdea: "Changing an object reference returns an object the caller should not be able to see.",
    defense: "Ownership checks per object, owner-scoped queries, opaque identifiers as defence in depth.",
    unlocksOn: { labId: "lab-02", challengeId: "L2C2" },
  },
  {
    id: "xss",
    name: "Cross-Site Scripting",
    klass: "Injection",
    coreIdea: "Attacker input is parsed as markup or script in another user's browser, in that user's origin.",
    defense: "Context-sensitive output encoding, safe DOM APIs, sanitization, strict CSP.",
    unlocksOn: { labId: "lab-03", challengeId: "L3C3" },
  },
  {
    id: "output-encoding",
    name: "Output Encoding",
    klass: "Secure Development",
    coreIdea: "Encoding is what turns a value back into data at the moment it becomes output. It is context-dependent.",
    defense: "Escape for the exact context: HTML text, attribute, URL, CSS or JavaScript.",
    unlocksOn: { labId: "lab-03", challengeId: "L3C4" },
  },
  {
    id: "path-traversal",
    name: "Path Traversal",
    klass: "Access Control",
    coreIdea: "User input changes which file is opened, escaping the intended directory.",
    defense: "Resolve to a canonical path, then verify it stays inside the allowed root. Prefer allowlists.",
    unlocksOn: { labId: "lab-04", challengeId: "L4C2" },
  },
  {
    id: "api-security",
    name: "API Security",
    klass: "Architecture",
    coreIdea: "Assume the client is hostile. Every rule the system relies on must be enforced on the server.",
    defense: "Server-side authorization, schema validation, minimal responses, explicit contracts.",
    unlocksOn: { labId: "lab-05", challengeId: "L5C1" },
  },
  {
    id: "data-minimization",
    name: "Data Minimization",
    klass: "Privacy",
    coreIdea: "Return only the fields the client actually needs. Data you never send cannot leak.",
    defense: "Explicit response objects, separate internal models from API schemas, response snapshot tests.",
    unlocksOn: { labId: "lab-05", challengeId: "L5C2" },
  },
  {
    id: "mass-assignment",
    name: "Mass Assignment",
    klass: "Secure Development",
    coreIdea: "Binding every submitted field lets the client choose what the server writes, including privilege fields.",
    defense: "Explicit allowlists of writable fields per endpoint, schema validation, separate read/write models.",
    unlocksOn: { labId: "lab-05", challengeId: "L5C4" },
  },
  {
    id: "rate-limiting",
    name: "Rate Limiting",
    klass: "Availability",
    coreIdea: "Bounding how fast one source can act makes automation expensive. It is a cost control, not an authorization control.",
    defense: "Per-user quotas, stricter limits on authentication, informative 429s, alerting on enumeration.",
    unlocksOn: { labId: "lab-05", challengeId: "L5C5" },
  },
  {
    id: "vulnerability-chaining",
    name: "Vulnerability Chaining",
    klass: "Risk",
    coreIdea: "Several individually moderate weaknesses can combine into a materially worse outcome than any one of them.",
    defense: "Fix the enabling controls and assess systems in chains rather than as isolated tickets.",
    unlocksOn: { labId: "lab-05", challengeId: "L5C6" },
  },
];

/** Fictional local training leaderboard. Not a real global ranking. */
export const LEADERBOARD: LeaderboardEntry[] = [
  { name: "ByteWalker", handle: "@bytewalker", xp: 4820 },
  { name: "NullPointer", handle: "@nullpointer", xp: 4610 },
  { name: "PacketGhost", handle: "@packetghost", xp: 4390 },
  { name: "CyberNova", handle: "@cybernova", xp: 4210 },
  { name: "RootKitten", handle: "@rootkitten", xp: 3980 },
  { name: "SegFault", handle: "@segfault", xp: 3720 },
  { name: "HexQueen", handle: "@hexqueen", xp: 3410 },
  { name: "StackSmash", handle: "@stacksmash", xp: 3150 },
];
