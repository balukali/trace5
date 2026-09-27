import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <SearchX className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
      <p className="mt-4 font-mono text-sm text-primary">404</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">Route not found</h1>
      <p className="mt-3 max-w-md text-sm text-muted-foreground">
        That endpoint does not exist in the TRACE//5 range. Head back to the dashboard and pick an
        investigation.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/dashboard">Go to dashboard</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/labs">Browse labs</Link>
        </Button>
      </div>
    </div>
  );
}
