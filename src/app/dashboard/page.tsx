import type { Metadata } from "next";
import { DashboardView } from "@/components/dashboard-view";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your TRACE//5 progress, statistics and lab selection.",
};

export default function DashboardPage() {
  return <DashboardView />;
}
