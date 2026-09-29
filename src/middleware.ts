import { NextResponse, type NextRequest } from "next/server";

/**
 * Per-lab container routing.
 *
 * The same image serves the whole platform. When a container is started with
 * TRACE5_LAB set (for example TRACE5_LAB=lab-03), requests to the root are
 * redirected to that lab so each challenge can be reached on its own port.
 *
 * When TRACE5_LAB is not set this is a no-op and the normal landing page is
 * served, so a single-container deployment behaves exactly as before.
 *
 * This is the ONLY place in the application that reads an environment
 * variable. It runs on the server, so nothing is exposed to the browser.
 */
export function middleware(request: NextRequest) {
  const lab = process.env.TRACE5_LAB;
  if (!lab || !/^lab-0[1-5]$/.test(lab)) return NextResponse.next();

  const { pathname } = request.nextUrl;
  // Only the bare root redirects; every other route is left alone so the lab
  // runner, write-up and navigation continue to work normally.
  if (pathname !== "/") return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = `/labs/${lab}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/"],
};
