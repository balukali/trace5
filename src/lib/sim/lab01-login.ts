/**
 * LAB 01 SIMULATOR - simulated authentication endpoint.
 *
 * SECURITY: no SQL string is ever built or executed. The learner's input is
 * matched against a small set of literal training patterns to decide which
 * canned response to replay. No database exists.
 */

export type LoginOutcome =
  | "empty"
  | "invalid"
  | "success"
  | "altered"
  | "bypass";

export interface LoginRequest {
  method: "POST";
  path: "/login";
  contentType: "application/x-www-form-urlencoded";
  body: { username: string; password: string };
}

export interface LoginResponse {
  status: number;
  statusText: string;
  outcome: LoginOutcome;
  message: string;
  simulation: true;
  account?: string;
  matchedSignature?: string;
  observations: string[];
}

/** Literal training signatures. Matched as plain substrings - never executed. */
const INJECTION_SIGNATURES: { id: string; pattern: string; account: string }[] = [
  { id: "or-true", pattern: "' or '1'='1", account: "demo_admin" },
  { id: "or-true-dash", pattern: "' or 1=1--", account: "demo_admin" },
  { id: "or-true-space", pattern: "' or true--", account: "demo_admin" },
  { id: "comment-bypass", pattern: "admin'--", account: "demo_admin" },
  { id: "union-select", pattern: "union select", account: "demo_admin" },
  { id: "always-true", pattern: "or '1'='1", account: "demo_admin" },
];

const KNOWN_USERS: Record<string, string> = {
  alex: "correct-horse",
  jordan: "hunter2-training",
  demo_admin: "northstar-training",
};

function norm(v: string) {
  return v.toLowerCase().trim();
}

export function buildLoginRequest(username: string, password: string): LoginRequest {
  return {
    method: "POST",
    path: "/login",
    contentType: "application/x-www-form-urlencoded",
    body: { username, password },
  };
}

export function simulateLogin(username: string, password: string): LoginResponse {
  const u = norm(username);
  const p = norm(password);

  if (!u && !p) {
    return {
      status: 400,
      statusText: "Bad Request",
      outcome: "empty",
      message: "Missing credentials.",
      simulation: true,
      observations: ["Both the username and the password were empty."],
    };
  }

  const hit = INJECTION_SIGNATURES.find((s) => u.includes(s.pattern) || p.includes(s.pattern));

  if (hit) {
    return {
      status: 200,
      statusText: "OK",
      outcome: "altered",
      matchedSignature: hit.id,
      message:
        "Training simulation: authentication condition altered. " +
        "No query was executed - this response is replayed from a fixed training table.",
      simulation: true,
      account: hit.account,
      observations: [
        "The authentication decision no longer depends on the submitted password.",
        "The response identifies an account the learner never authenticated as.",
        "Input reached the logic that decides who you are.",
      ],
    };
  }

  if (u === "demo_admin" && p === "northstar-training") {
    return {
      status: 200,
      statusText: "OK",
      outcome: "bypass",
      message: "Signed in as demo_admin (simulated training account).",
      simulation: true,
      account: "demo_admin",
      observations: [
        "This is the post-migration demo tenant account.",
        "It exists to support internal demos, not production use.",
      ],
    };
  }

  if (KNOWN_USERS[u] && KNOWN_USERS[u] === p) {
    return {
      status: 200,
      statusText: "OK",
      outcome: "success",
      message: `Signed in as ${u} (simulated).`,
      simulation: true,
      account: u,
      observations: [
        "Normal authentication path: the password was verified and a session was issued.",
      ],
    };
  }

  return {
    status: 401,
    statusText: "Unauthorized",
    outcome: "invalid",
    message: "Invalid credentials.",
    simulation: true,
    observations: [
      "The error is flat: it does not reveal whether the user or the password was wrong.",
      "That is good practice - keep it that way.",
    ],
  };
}

export const SUGGESTED_TRAINING_INPUTS = [
  "alex",
  "alex' OR '1'='1",
  "demo_admin'--",
  "' OR 1=1--",
];

