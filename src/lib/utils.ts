import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function starsFor(difficulty: number) {
  return "★".repeat(difficulty) + "☆".repeat(5 - difficulty);
}
