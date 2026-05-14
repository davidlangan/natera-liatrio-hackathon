"use client";

import { useEffect, useState } from "react";

function diff(target: Date) {
  const ms = Math.max(0, target.getTime() - Date.now());
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return { days, hours, minutes, seconds, ms };
}

export function Countdown({
  closesAt,
  label = "VOTING CLOSES IN",
  compact = false,
}: {
  closesAt: string | null;
  label?: string;
  compact?: boolean;
}) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  if (!closesAt) {
    return (
      <div className="text-text-muted-dark text-[14px]">
        <span className="eyebrow">VOTING WINDOW</span>{" "}
        <span className="ml-2">Not yet scheduled.</span>
      </div>
    );
  }

  const target = new Date(closesAt);
  const d = diff(target);
  const ended = d.ms === 0;

  if (compact) {
    return (
      <div className="flex items-baseline gap-2 text-text-muted-dark text-[14px]">
        <span className="eyebrow">{label}</span>
        <span className="tabular-nums text-text-on-dark">
          {ended
            ? "Closed"
            : `${d.days}d ${String(d.hours).padStart(2, "0")}h ${String(
                d.minutes,
              ).padStart(2, "0")}m ${String(d.seconds).padStart(2, "0")}s`}
        </span>
        <span hidden>{tick}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2" aria-live="polite">
      <span className="eyebrow">{label}</span>
      {ended ? (
        <p className="stat-big" style={{ color: "#f59e0b" }}>
          Closed
        </p>
      ) : (
        <div className="flex items-baseline gap-4 sm:gap-6">
          <Block n={d.days} unit="days" />
          <Block n={d.hours} unit="hrs" />
          <Block n={d.minutes} unit="min" />
          <Block n={d.seconds} unit="sec" />
        </div>
      )}
    </div>
  );
}

function Block({ n, unit }: { n: number; unit: string }) {
  return (
    <div className="flex flex-col items-start">
      <span className="stat-big tabular-nums">
        {String(n).padStart(2, "0")}
      </span>
      <span className="text-text-muted-dark text-[12px] tracking-eyebrow uppercase">
        {unit}
      </span>
    </div>
  );
}
