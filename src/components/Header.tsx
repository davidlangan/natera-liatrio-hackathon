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
export function Header({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const pathname = usePathname();
  const isLight = variant === "light";

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
        </nav>
      </div>
    </header>
  );
}
