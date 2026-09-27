import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border/70 bg-card/40">
      <div className="container py-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-md space-y-3">
            <p className="font-mono text-sm font-bold">
              TRACE<span className="text-primary">{"//"}</span>5
            </p>
            <p className="text-sm text-muted-foreground">
              Break it. Understand it. Fix it. A hands-on cybersecurity investigation range for
              learning web security through realistic, fully simulated assessments.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
            <div>
              <p className="hud-label mb-3">Platform</p>
              <ul className="space-y-2">
                <li>
                  <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/labs" className="text-muted-foreground hover:text-foreground">
                    All labs
                  </Link>
                </li>
                <li>
                  <Link href="/concepts" className="text-muted-foreground hover:text-foreground">
                    Concept cards
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="hud-label mb-3">Community</p>
              <ul className="space-y-2">
                <li>
                  <Link href="/leaderboard" className="text-muted-foreground hover:text-foreground">
                    Leaderboard
                  </Link>
                </li>
                <li>
                  <Link href="/certificate" className="text-muted-foreground hover:text-foreground">
                    Certificate
                  </Link>
                </li>
              </ul>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="hud-label mb-3">Engagement</p>
              <p className="text-sm text-muted-foreground">
                Northstar Systems is a fictional company. All targets, users, invoices and files in
                this platform are simulated training data.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" aria-hidden="true" />
            Educational simulation. No real systems are targeted and no user input is ever
            executed.
          </p>
          <p className="font-mono">Progress is stored locally in your browser.</p>
        </div>
      </div>
    </footer>
  );
}
