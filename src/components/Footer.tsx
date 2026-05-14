import clsx from "clsx";
import { LiatrioLogo, NateraLogo } from "./Logos";
import { EVENT_DATE } from "@/lib/constants";

export function Footer({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const isLight = variant === "light";
  return (
    <footer
      className={clsx(
        "w-full border-t",
        isLight
          ? "border-border-light bg-bg-light text-text-muted-light"
          : "border-border-dark bg-bg-dark text-text-muted-dark",
      )}
    >
      <div className="mx-auto max-w-6xl px-6 py-10 flex flex-col items-center gap-4">
        <div className="flex items-center gap-3 opacity-90">
          <NateraLogo className="h-6 w-auto" />
          <span aria-hidden className="text-base font-light">
            ×
          </span>
          <LiatrioLogo
            className="h-6 w-auto"
            variant={isLight ? "color" : "white"}
          />
        </div>
        <p className="text-[12px] tracking-eyebrow uppercase">
          Internal · AI Hackathon · {EVENT_DATE}
        </p>
      </div>
    </footer>
  );
}
