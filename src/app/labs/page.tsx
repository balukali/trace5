import type { Metadata } from "next";
import { LabsIndex } from "@/components/labs-index";

export const metadata: Metadata = {
  title: "Labs",
  description: "Five progressive cybersecurity labs: authentication, authorization, XSS, traversal and API security.",
};

export default function LabsPage() {
  return <LabsIndex />;
}
