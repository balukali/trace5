"use client";

import * as React from "react";
import {
  HelpCircle,
  AlertTriangle,
  Eye,
  Bug,
  Search,
  ShieldCheck,
  FlaskConical,
} from "lucide-react";
import type { Challenge } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const SECTIONS = [
  { id: "what", label: "What is happening?", icon: HelpCircle },
  { id: "why", label: "Why does it happen?", icon: Bug },
  { id: "danger", label: "Why is it dangerous?", icon: AlertTriangle },
  { id: "discovery", label: "How would an attacker discover it?", icon: Search },
  { id: "prevention", label: "How should developers prevent it?", icon: ShieldCheck },
  { id: "testing", label: "How would you test the fix?", icon: FlaskConical },
] as const;

export function LearningPanelView({
  challenge,
  solved,
}: {
  challenge: Challenge;
  solved: boolean;
}) {
  const learn = challenge.learning;

  return (
    <div className="panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-card/60 px-4 py-3">
        <p className="flex items-center gap-2 hud-label">
          <Eye className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          Learning panel
        </p>
        {solved && (
          <Badge variant="success" className="font-mono">
            unlocked
          </Badge>
        )}
      </div>

      <Tabs defaultValue="what">
        <div className="px-4 pt-4">
          <TabsList aria-label="Learning panel sections">
            {SECTIONS.map((s) => (
              <TabsTrigger key={s.id} value={s.id}>
                {s.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {SECTIONS.map((s) => {
          const Icon = s.icon;
          return (
            <TabsContent key={s.id} value={s.id} className="px-4 pb-4">
              <div className="rounded-md border border-border bg-background/50 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                  {s.label}
                </p>
                <p className="prose-ctf mt-2">{learn[s.id]}</p>
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
