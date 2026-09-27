/**
 * TRACE//5 core data model.
 *
 * Every lab, challenge, hint, simulator response and write-up is defined
 * declaratively so the CTF engine can stay generic and data-driven.
 */

export type ChallengeType =
  | "multiple-choice"
  | "multiple-answer"
  | "flag"
  | "terminal"
  | "request"
  | "evidence"
  | "configuration"
  | "report";

export type Difficulty = "Easy" | "Medium" | "Hard" | "Expert";

export type LabId = "lab-01" | "lab-02" | "lab-03" | "lab-04" | "lab-05";

export interface Hint {
  level: number;
  text: string;
  /** XP deducted when this hint is revealed (0 = free). */
  cost: number;
}

export interface AnswerOption {
  id: string;
  label: string;
  correct: boolean;
  /** Shown after the challenge is solved. */
  rationale?: string;
}

export interface LearningPanel {
  what: string;
  why: string;
  danger: string;
  discovery: string;
  prevention: string;
  testing: string;
}

export interface CodeSample {
  language: "text" | "ts" | "http" | "json" | "bash" | "sql";
  vulnerable?: string;
  secure?: string;
  note?: string;
}

export interface Challenge {
  id: string;
  labId: LabId;
  index: number;
  title: string;
  codename: string;
  description: string;
  difficulty: Difficulty;
  type: ChallengeType;
  objective: string;
  story?: string;
  hints: Hint[];
  learning: LearningPanel;
  code?: CodeSample;
  xp: number;
  /** SHA-256 style digest of the expected flag (never the flag itself). */
  flagDigest?: string;
  /** For multiple-choice / multiple-answer. */
  options?: AnswerOption[];
  /** Simulator key that must be exercised before the flag is accepted. */
  requiresEvidence?: string[];
  /** Free-text report fields (lab 05 incident report). */
  reportFields?: { id: string; label: string; placeholder: string; keywords: string[] }[];
  /** Terminal commands that count as evidence for this challenge. */
  evidenceCommands?: string[];
}

export interface WriteUp {
  overview: string;
  concept: string;
  solution: string;
  whyItWorks: string;
  remediation: string;
  realWorld: string;
  flag: string;
}

export interface LabConcept {
  name: string;
  klass: string;
  coreIdea: string;
  defense: string;
}

export interface Lab {
  id: LabId;
  number: number;
  title: string;
  codename: string;
  tagline: string;
  difficulty: number;
  difficultyLabel: Difficulty;
  xpTotal: number;
  target: string;
  brief: string;
  story: string[];
  objectives: string[];
  concepts: LabConcept[];
  terminals: string[];
  terminal: "portal" | "invoices" | "feedback" | "docs" | "capi";
  challenges: Challenge[];
  writeUp: WriteUp;
}

export interface ConceptCard {
  id: string;
  name: string;
  klass: string;
  coreIdea: string;
  defense: string;
  unlocksOn: { labId: LabId; challengeId: string };
}

export interface LeaderboardEntry {
  name: string;
  handle: string;
  xp: number;
  you?: boolean;
}

export interface ProgressState {
  version: number;
  xp: number;
  solved: Record<string, SolvedRecord>;
  hintsUsed: Record<string, number>;
  walkthroughs: string[];
  evidence: Record<string, string[]>;
  lastChallenge?: string;
  completedAt?: string;
  certName?: string;
}

export interface SolvedRecord {
  at: string;
  xpAwarded: number;
  hintsUsed: number;
  walkthroughRevealed: boolean;
  attempts: number;
}

export const XP_PER_LAB = 1000;
export const XP_TOTAL = XP_PER_LAB * 5;

/** Total number of challenges across all five labs (28). */
export const TOTAL_CHALLENGES = 28;
