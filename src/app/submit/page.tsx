import type { Metadata } from "next";
import { SubmitView } from "@/components/submit-view";

export const metadata: Metadata = {
  title: "Submit a flag",
  description: "Submit any captured flag to be matched against the challenges you have not solved yet.",
};

export default function SubmitPage() {
  return <SubmitView />;
}
