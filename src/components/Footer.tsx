import { LiatrioLogo, NateraLogo } from "./Logos";
import { EVENT_DATE } from "@/lib/constants";

/**
 * Footer is always dark for the same reason as Header — the official Liatrio
 * mark is reverse-preferred. Both light- and dark-variant pages anchor on a
 * consistent dark brand strip at the bottom.
 *
 * The `variant` prop is accepted for API parity with existing callers but
 * has no visual effect; treatment is uniform across pages.
 */
export function Footer({ variant: _variant = "dark" }: { variant?: "dark" | "light" }) {
  return (
    <footer className="w-full border-t border-border-dark bg-bg-darker text-text-muted-dark">
      <div className="mx-auto max-w-6xl px-6 py-10 flex flex-col items-center gap-5">
        <div className="flex items-center gap-4 sm:gap-5 opacity-95">
          <NateraLogo className="h-6 w-auto" />
          <span aria-hidden className="text-base font-light text-text-dim-dark">
            ×
          </span>
          <LiatrioLogo className="h-5 w-auto" />
        </div>
        <p className="text-[11px] tracking-eyebrow uppercase text-text-dim-dark">
          Internal · AI Hackathon · {EVENT_DATE}
        </p>
      </div>
    </footer>
  );
}
