"use client";

import Link from "next/link";
import { LiatrioLogo, NateraLogo } from "./Logos";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const NAV = [
  { href: "/register", label: "Register" },
  { href: "/vote", label: "Vote" },
];

export function Header({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const pathname = usePathname();
  const isLight = variant === "light";
  return (
    <header
      className={clsx(
        "w-full",
        isLight ? "text-text-on-light" : "text-text-on-dark",
      )}
    >
      <div className="mx-auto max-w-6xl px-6 py-5 flex items-center justify-between gap-4">
        <Link
          href="/"
          aria-label="Natera × Liatrio AI Hackathon"
          className="flex items-center gap-3 shrink-0"
        >
          <NateraLogo className="h-7 sm:h-8 w-auto" />
          <span
            aria-hidden
            className={clsx(
              "text-base sm:text-lg font-light",
              isLight ? "text-text-muted-light" : "text-text-muted-dark",
            )}
          >
            ×
          </span>
          <LiatrioLogo
            className="h-7 sm:h-8 w-auto"
            variant={isLight ? "color" : "white"}
          />
        </Link>

        <nav
          aria-label="Primary"
          className="hidden md:flex items-center gap-1"
        >
          {NAV.map((n) => {
            const active =
              n.href === "/"
                ? pathname === "/"
                : pathname?.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={clsx(
                  "px-3 py-2 rounded-lg text-[14px] transition-colors",
                  active
                    ? isLight
                      ? "text-natera-blue-deep"
                      : "text-liatrio-green"
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
