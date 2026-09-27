import type { Metadata } from "next";
import { LeaderboardView } from "@/components/leaderboard-view";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "A local, simulated training leaderboard. Your score updates as you solve challenges.",
};

export default function LeaderboardPage() {
  return <LeaderboardView />;
}
