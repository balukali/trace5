import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles, Terminal, Zap, GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LABS } from "@/lib/data/labs";
import { XP_TOTAL } from "@/lib/types";
import { StatStrip } from "@/components/stat-strip";

export default function HomePage() {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-60" aria-hidden="true" />

      <section className="container relative flex min-h-[78vh] flex-col justify-center py-20">
        <div className="mx-auto max-w-4xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 font-mono text-xs uppercase tracking-[0.2em] text-primary">
            <span className="h-1.5 w-1.5 animate-blink rounded-full bg-primary" aria-hidden="true" />
            Cybersecurity Investigation Range
          </p>

          <h1 className="mt-8 font-mono text-5xl font-black tracking-tight sm:text-7xl">
            TRACE<span className="text-primary">{"//"}</span>5
          </h1>

          <p className="mt-6 text-2xl font-semibold tracking-tight sm:text-3xl">
            Break it. <span className="text-primary">Understand it.</span>{" "}
            <span className="text-trace-amber">Fix it.</span>
          </p>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            A hands-on cybersecurity CTF environment for learning web security through realistic
            investigations. Five labs, 28 challenges, and a full report for every finding you
            uncover.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/dashboard">
                Start Investigation <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
              <Link href="/labs">Explore Labs</Link>
            </Button>
          </div>

          <StatStrip />
        </div>
      </section>

      <section className="container relative py-16">
        <div className="grid gap-4 md:grid-cols-3">
          <Feature
            icon={Terminal}
            title="Real assessments, safe targets"
            body="Each lab puts you inside a simulated Northstar application with a scenario, evidence to gather and a report to write. Nothing you type ever reaches a real system."
          />
          <Feature
            icon={GitBranch}
            title="Five progressive labs"
            body="From an authentication flaw in a rushed migration to a chained API incident, each lab builds on the concepts the previous one taught."
          />
          <Feature
            icon={ShieldCheck}
            title="Learn the fix, not just the bug"
            body="Every challenge explains what is happening, why it is dangerous, how an attacker finds it, how to prevent it and how to verify the fix."
          />
        </div>
      </section>


      <section className="container relative py-16">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="hud-label">The Range</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              Five labs. {XP_TOTAL.toLocaleString()} XP.
            </h2>
          </div>
          <Button asChild variant="ghost" className="text-primary">
            <Link href="/labs">
              View all labs <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {LABS.map((lab) => (
            <Link
              key={lab.id}
              href={`/labs/${lab.id}`}
              className="group panel relative overflow-hidden p-5 transition-colors hover:border-primary/50"
            >
              <div className="flex items-start justify-between">
                <span className="hud-label">Lab {String(lab.number).padStart(2, "0")}</span>
                <span
                  className="font-mono text-xs tracking-widest text-trace-amber"
                  aria-label={`Difficulty ${lab.difficulty} of 5`}
                >
                  {"★".repeat(lab.difficulty)}
                  <span className="text-muted-foreground/50">{"★".repeat(5 - lab.difficulty)}</span>
                </span>
              </div>
              <h3 className="mt-3 text-lg font-semibold tracking-tight group-hover:text-primary">
                {lab.title}
              </h3>
              <p className="mt-1 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                {lab.codename}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{lab.tagline}</p>
              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <Zap className="h-3.5 w-3.5 text-trace-amber" aria-hidden="true" />
                {lab.challenges.length} challenges · {lab.xpTotal.toLocaleString()} XP
              </div>
            </Link>
          ))}

          <div className="panel flex flex-col items-center justify-center gap-2 border-dashed p-5 text-center">
            <Sparkles className="h-6 w-6 text-trace-amber" aria-hidden="true" />
            <p className="text-sm font-medium">Certificate of completion</p>
            <p className="text-xs text-muted-foreground">
              Finish all five labs to earn your investigator certificate.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-2">
              <Link href="/certificate">View certificate</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="panel p-6">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="mt-4 font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
