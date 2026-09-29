/**
 * Submission attempt log.
 *
 * A CTF-style flag page needs to show how many attempts a challenge has taken
 * and when it was last touched, which is exactly what `attempts` on the solved
 * record does not carry while a challenge is still unsolved. This keeps a
 * separate, namespaced tally so the progress state stays unchanged.
 */

const KEY = "trace5.attempts.v1";

type AttemptLog = Record<string, { count: number; lastAt: string }>;

function read(): AttemptLog {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed as AttemptLog;
  } catch {
    return {};
  }
}

function write(log: AttemptLog) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(log));
  } catch {
    /* storage full or unavailable - the tally is advisory only */
  }
}

/** Increment the attempt counter for a challenge. */
export function registerAttempt(challengeId: string) {
  const log = read();
  const current = log[challengeId];
  log[challengeId] = { count: (current?.count ?? 0) + 1, lastAt: new Date().toISOString() };
  write(log);
}

/** Read the attempt counters without subscribing to updates. */
export function getAttempts(): AttemptLog {
  return read();
}
