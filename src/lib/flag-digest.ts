/**
 * Flag digesting.
 *
 * TRACE//5 is a client-side learning CTF, so this is NOT a security control.
 * It exists so that the correct flag for an unsolved challenge is not present
 * as readable plaintext in the shipped JavaScript bundle or in view-source.
 * Once a challenge is solved, its flag is intentionally revealed to the
 * learner through the write-up.
 *
 * The digest is a deterministic, non-cryptographic 64-bit FNV-1a style hash
 * rendered as 16 hex characters. A salt derived from the challenge id keeps
 * digests from being reusable across challenges.
 */

function fnv1a64(input: string): string {
  // Two independent 32-bit FNV-1a passes combined into a 64-bit hex string.
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;

  for (let i = 0; i < input.length; i += 1) {
    const c = input.charCodeAt(i);
    h1 ^= c;
    h1 = Math.imul(h1, 0x01000193) >>> 0;
    h2 = (h2 + c) >>> 0;
    h2 = Math.imul(h2 ^ (h2 >>> 13), 0x85ebca6b) >>> 0;
    h2 = (h2 ^ (h2 >>> 16)) >>> 0;
  }

  return h1.toString(16).padStart(8, "0") + h2.toString(16).padStart(8, "0");
}

/** Normalises a learner-entered flag so formatting differences don't matter. */
export function normalizeFlag(input: string): string {
  return input
    .trim()
    .replace(/\r?\n/g, "")
    .replace(/\s+/g, " ")
    .toUpperCase();
}

/** Produces the stored digest for a challenge flag. */
export function digestFlag(challengeId: string, flag: string): string {
  return fnv1a64(`${challengeId}::${normalizeFlag(flag)}`);
}

/** True when the submitted value matches the stored digest. */
export function verifyFlagDigest(
  challengeId: string,
  submission: string,
  storedDigest: string,
): boolean {
  return digestFlag(challengeId, submission) === storedDigest;
}
