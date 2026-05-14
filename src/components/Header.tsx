"use client";

import Link from "next/link";
import { LiatrioLogo, NateraLogo } from "./Logos";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const NAV = [
  { href: "/register", label: "Submit Demo" },
  { href: "/vote", label: "Vote" },
];

/**
 * Header is split into two strips:
 *  - Top brand strip (always dark) — official Natera + Liatrio marks
 *  - Nav strip (adapts to page variant) — sits on the page background
 *
 * The brand strip is always dark because the official Liatrio mark is a
 * white wordmark + green flame, designed exclusively for dark surfaces.
 * Rendering it on a light band would make the wordmark invisible. The
 * navigation pills below adapt to the variant so the surrounding page
 * keeps its tone.
 */
/**
 * Inline lock icon — heroicons-style outline, single path. 16px stroke.
 * Kept inline to avoid pulling in an icon dependency.
 */
function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <path d="M16.5 10.5V7.125a4.5 4.5 0 1 0-9 0V10.5m-1.125 0h11.25c.621 0 1.125.504 1.125 1.125v8.25c0 .621-.504 1.125-1.125 1.125H6.375A1.125 1.125 0 0 1 5.25 19.875v-8.25c0-.621.504-1.125 1.125-1.125Z" />
    </svg>
  );
}

export function Header({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const pathname = usePathname();
  const isLight = variant === "light";
  const adminActive = pathname?.startsWith("/admin") ?? false;

  return (
    <header className="w-full">
      {/* === Brand strip (always dark) === */}
      <div className="w-full bg-bg-darker border-b border-border-dark/60">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between gap-4">
          <Link
            href="/"
            aria-label="Natera × Liatrio AI Hackathon"
            className="flex items-center gap-4 sm:gap-5 shrink-0 group"
          >
            <NateraLogo className="h-7 sm:h-8 w-auto" />
            <span
              aria-hidden
              className="text-lg sm:text-xl font-light text-text-dim-dark"
            >
              ×
            </span>
            <LiatrioLogo className="h-6 sm:h-7 w-auto" />
          </Link>

          <span className="hidden sm:inline-flex items-center gap-2 text-[11px] font-semibold tracking-eyebrow uppercase text-text-dim-dark">
            <span
              className="w-1.5 h-1.5 rounded-full bg-liatrio-green"
              aria-hidden
            />
            AI Hackathon · 2026
          </span>
        </div>
      </div>

      {/* === Nav strip (adapts to page variant) === */}
      <div
        className={clsx(
          "w-full",
          isLight ? "text-text-on-light" : "text-text-on-dark",
        )}
      >
        <nav
          aria-label="Primary"
          className="mx-auto max-w-6xl px-6 py-3 flex items-center justify-end gap-1"
        >
          {NAV.map((n) => {
            const active = pathname?.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={clsx(
                  "nav-pill transition-colors",
                  active
                    ? "nav-pill-active"
                    : isLight
                      ? "text-text-muted-light hover:text-text-on-light"
                      : "text-text-muted-dark hover:text-text-on-dark",
                )}
              >
                {n.label}
              </Link>
            );
          })}

          {/*
           * Admin escape-hatch: deliberately set apart from the primary pills
           * (extra left margin + ghost/outline treatment) so it reads as a
           * staff entry point rather than a peer CTA. The /admin page itself
           * handles the passcode prompt, so this is just a link.
           */}
          <Link
            href="/admin"
            aria-label="Admin"
            aria-current={adminActive ? "page" : undefined}
            className={clsx(
              "ml-2 inline-flex items-center justify-center rounded-full border text-sm font-semibold transition-colors",
              "h-8 w-8 md:h-auto md:w-auto md:gap-1.5 md:px-3 md:py-1.5",
              adminActive
                ? "border-liatrio-green/60 bg-liatrio-green/10 text-liatrio-green hover:bg-liatrio-green/15"
                : isLight
                  ? "border-border-light text-text-muted-light hover:text-text-on-light hover:border-text-muted-light"
                  : "border-border-dark text-text-muted-dark hover:text-text-on-dark hover:border-border-dark-2",
            )}
          >
            <LockIcon className="h-4 w-4 shrink-0" />
            <span className="hidden md:inline">Admin</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
