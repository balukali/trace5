"use client";

import { z } from "zod";
import { verifyFlagDigest } from "@/lib/flag-digest";
import type { Challenge, Lab } from "@/lib/types";

/**
 * Centralised, data-driven challenge validation.
 *
 * The engine never executes learner input. It compares a submission against
 * the declarative definition of a challenge and returns a structured verdict.
 */

export type SubmissionValue =
  | { kind: "choice"; ids: string[] }
  | { kind: "flag"; value: string }
  | { kind: "report"; fields: Record<string, string> }
  | { kind: "none" };

export type Verdict =
  | { status: "correct"; awardedXp: number; message: string; partial: string[] }
  | { status: "incorrect"; message: string; missing: string[] }
  | { status: "evidence"; message: string; missing: string[] };

export const reportFieldSchema = z.record(z.string(), z.string().max(4000));

/** XP is reduced by hints already spent on this challenge. */
export function computeAward(
  challenge: Challenge,
  hintsUsed: number,
  walkthroughRevealed: boolean,
): number {
  const spent = challenge.hints
    .slice(0, hintsUsed)
    .reduce((sum, h) => sum + h.cost, 0);
  const walkthroughCost = walkthroughRevealed ? 50 : 0;
  return Math.max(10, challenge.xp - spent - walkthroughCost);
}

function hasAllEvidence(challenge: Challenge, evidence: string[]): boolean {
  if (!challenge.requiresEvidence?.length) return true;
  return challenge.requiresEvidence.every((key) => evidence.includes(key));
}

export function validateSubmission(
  challenge: Challenge,
  submission: SubmissionValue,
  ctx: { evidence: string[]; hintsUsed: number; walkthroughRevealed: boolean },
): Verdict {
  const awardedXp = computeAward(challenge, ctx.hintsUsed, ctx.walkthroughRevealed);

  if (!hasAllEvidence(challenge, ctx.evidence)) {
    const missing = (challenge.requiresEvidence ?? []).filter(
      (k) => !ctx.evidence.includes(k),
    );
    return {
      status: "evidence",
      message: "Complete the required investigation step in the target environment first.",
      missing,
    };
  }

  if (challenge.type === "flag") {
    if (submission.kind !== "flag") {
      return { status: "incorrect", message: "Enter a flag to submit.", missing: [] };
    }
    if (!challenge.flagDigest) {
      return { status: "correct", awardedXp, message: "Investigation confirmed.", partial: [] };
    }
    if (verifyFlagDigest(challenge.id, submission.value, challenge.flagDigest)) {
      return { status: "correct", awardedXp, message: "FLAG ACCEPTED", partial: [] };
    }
    return {
      status: "incorrect",
      message: "INVALID FLAG — review the evidence and try again.",
      missing: [],
    };
  }

  if (challenge.type === "report") {
    if (submission.kind !== "report") {
      return { status: "incorrect", message: "Complete every report field.", missing: [] };
    }
    const parsed = reportFieldSchema.safeParse(submission.fields);
    if (!parsed.success) {
      return { status: "incorrect", message: "Report format is invalid.", missing: [] };
    }
    const fields = challenge.reportFields ?? [];
    const missing: string[] = [];
    for (const field of fields) {
      const value = (parsed.data[field.id] ?? "").toLowerCase();
      if (value.trim().length < 12) {
        missing.push(field.label);
        continue;
      }
      const hit = field.keywords.some((kw) => value.includes(kw.toLowerCase()));
      if (!hit) missing.push(field.label);
    }
    if (missing.length === 0) {
      return {
        status: "correct",
        awardedXp,
        message: "Incident report accepted. Chain confirmed.",
        partial: [],
      };
    }
    return {
      status: "incorrect",
      message: `The report is missing key analysis in: ${missing.join(", ")}.`,
      missing,
    };
  }

  // Choice-style challenges (single or multi select).
  if (submission.kind !== "choice") {
    return {
      status: "incorrect",
      message:
        challenge.type === "multiple-answer"
          ? "Select every option that applies."
          : "Select an answer and submit.",
      missing: [],
    };
  }
  const options = challenge.options ?? [];
  const correct = options.filter((o) => o.correct).map((o) => o.id);
  const chosen = submission.ids;
  const partial = correct.filter((id) => chosen.includes(id));
  const isRight = chosen.length === correct.length && correct.every((id) => chosen.includes(id));
  if (isRight) {
    return { status: "correct", awardedXp, message: "Correct analysis.", partial };
  }
  return {
    status: "incorrect",
    message:
      partial.length > 0
        ? `Partially correct — ${partial.length} of ${correct.length} identified.`
        : challenge.type === "multiple-answer"
          ? "None of the selected options match the evidence."
          : "That is not what the evidence shows. Try again.",
    missing: correct.filter((id) => !chosen.includes(id)),
  };
}

export function labProgress(lab: Lab, solved: Record<string, unknown>) {
  const total = lab.challenges.length;
  const done = lab.challenges.filter((c) => solved[c.id]).length;
  const xp = lab.challenges.filter((c) => solved[c.id]).reduce((sum, c) => sum + c.xp, 0);
  return { total, done, xp, complete: done === total };
}
