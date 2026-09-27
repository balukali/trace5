import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ProgressProvider } from "@/lib/progress-context";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "TRACE//5 — Cybersecurity Investigation Range",
    template: "%s — TRACE//5",
  },
  description:
    "A hands-on cybersecurity CTF environment. Five simulated Northstar Systems investigations covering SQL injection, broken access control, XSS, path traversal and API security.",
  keywords: [
    "cybersecurity",
    "CTF",
    "web security",
    "training",
    "SQL injection",
    "XSS",
    "IDOR",
    "path traversal",
    "API security",
  ],
  authors: [{ name: "TRACE//5" }],
  openGraph: {
    title: "TRACE//5 — Break it. Understand it. Fix it.",
    description:
      "A browser-based cybersecurity CTF training platform with five progressive labs and 28 challenges.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#080b11",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body className="min-h-dvh font-sans">
        <ProgressProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
          >
            Skip to main content
          </a>
          <SiteHeader />
          <main id="main">{children}</main>
          <SiteFooter />
        </ProgressProvider>
      </body>
    </html>
  );
}
