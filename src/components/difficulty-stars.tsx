import { cn } from "@/lib/utils";

const LABELS: Record<number, string> = {
  1: "Easy",
  2: "Easy",
  3: "Medium",
  4: "Hard",
  5: "Expert",
};

export function DifficultyStars({
  level,
  showLabel = true,
  className,
}: {
  level: number;
  showLabel?: boolean;
  className?: string;
}) {
  const clamped = Math.max(1, Math.min(5, level));
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="font-mono text-xs tracking-widest text-trace-amber" aria-hidden="true">
        {"★".repeat(clamped)}
        <span className="text-muted-foreground/40">{"★".repeat(5 - clamped)}</span>
      </span>
      {showLabel && (
        <span className="hud-label">
          {LABELS[clamped]} · {clamped}/5
        </span>
      )}
      <span className="sr-only">
        Difficulty {LABELS[clamped]}, {clamped} out of 5
      </span>
    </span>
  );
}

export const DIFFICULTY_LABEL = LABELS;
