"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Terminal, Trophy, GraduationCap, LayoutDashboard, BookOpen, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProgress } from "@/lib/progress-context";
import { XP_TOTAL } from "@/lib/types";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/labs", label: "Labs", icon: Terminal },
  { href: "/submit", label: "Submit", icon: Flag },
  { href: "/concepts", label: "Concepts", icon: BookOpen },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/certificate", label: "Certificate", icon: GraduationCap },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { state, hydrated } = useProgress();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const pct = Math.min(100, Math.round((state.xp / XP_TOTAL) * 100));

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="group flex items-center gap-2.5" aria-label="TRACE//5 home">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-md border border-primary/40 bg-primary/10 font-mono text-sm font-bold text-primary transition-colors group-hover:bg-primary/20">
            T5
            <span className="absolute inset-0 animate-pulse-ring rounded-md" aria-hidden="true" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-mono text-base font-bold tracking-tight">
              TRACE<span className="text-primary">{"//"}</span>5
            </span>
            <span className="hidden text-[10px] uppercase tracking-[0.2em] text-muted-foreground sm:block">
              Investigation Range
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <div
            className="hidden items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 sm:flex"
            title={hydrated ? `${state.xp} of ${XP_TOTAL} XP earned` : "Loading progress"}
          >
            <span className="hud-label">XP</span>
            <span className="font-mono text-sm font-semibold tabular-nums text-primary">
              {hydrated ? state.xp.toLocaleString() : "—"}
            </span>
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted" aria-hidden="true">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-400 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close navigation menu" : "Open navigation menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" className="border-t border-border bg-card md:hidden" aria-label="Mobile">
          <div className="container flex flex-col py-2">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-3 text-sm",
                    active ? "bg-muted text-foreground" : "text-muted-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            <div className="mt-2 border-t border-border px-3 pt-3 pb-1 sm:hidden">
              <span className="hud-label">Progress</span>
              <p className="font-mono text-sm text-primary">
                {hydrated ? state.xp.toLocaleString() : "—"} / {XP_TOTAL.toLocaleString()} XP
              </p>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
