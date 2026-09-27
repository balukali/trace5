import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LABS, getLab } from "@/lib/data/labs";
import { LabBriefing } from "@/components/lab-briefing";

export function generateStaticParams() {
  return LABS.map((lab) => ({ labId: lab.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ labId: string }>;
}): Promise<Metadata> {
  const { labId } = await params;
  const lab = getLab(labId);
  if (!lab) return { title: "Lab not found" };
  return {
    title: `Lab ${String(lab.number).padStart(2, "0")} — ${lab.title}`,
    description: lab.brief,
  };
}

export default async function LabPage({ params }: { params: Promise<{ labId: string }> }) {
  const { labId } = await params;
  const lab = getLab(labId);
  if (!lab) notFound();
  return <LabBriefing lab={lab} />;
}
