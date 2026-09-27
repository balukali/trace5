import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LABS, getLab } from "@/lib/data/labs";
import { LabRunner } from "@/components/lab-runner";

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
  return { title: `Lab ${String(lab.number).padStart(2, "0")} — Range`, description: lab.brief };
}

export default async function LabRunPage({ params }: { params: Promise<{ labId: string }> }) {
  const { labId } = await params;
  const lab = getLab(labId);
  if (!lab) notFound();

  return (
    <Suspense
      fallback={
        <div className="container py-20 text-center">
          <p className="hud-label">Loading investigation environment…</p>
        </div>
      }
    >
      <LabRunner lab={lab} />
    </Suspense>
  );
}
