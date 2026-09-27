import type { Lab, LabId } from "@/lib/types";
import { lab01 } from "./lab-01";
import { lab02 } from "./lab-02";
import { lab03 } from "./lab-03";
import { lab04 } from "./lab-04";
import { lab05 } from "./lab-05";

export const LABS: Lab[] = [lab01, lab02, lab03, lab04, lab05];

export function getLab(id: string): Lab | undefined {
  return LABS.find((lab) => lab.id === id);
}

export function getNextLab(id: LabId): Lab | undefined {
  const index = LABS.findIndex((lab) => lab.id === id);
  return index >= 0 ? LABS[index + 1] : undefined;
}

export function getLabNumber(id: string): number {
  return getLab(id)?.number ?? 0;
}

export const TOTAL_CHALLENGES = LABS.reduce((sum, lab) => sum + lab.challenges.length, 0);

export const ALL_CHALLENGES = LABS.flatMap((lab) => lab.challenges);
