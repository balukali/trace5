import type { Metadata } from "next";
import { ConceptsView } from "@/components/concepts-view";

export const metadata: Metadata = {
  title: "Concepts",
  description: "Concept cards covering authentication, injection, access control, XSS, traversal and API security.",
};

export default function ConceptsPage() {
  return <ConceptsView />;
}
