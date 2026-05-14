"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { Standing } from "@/types/db";

type Props = {
  initialStandings: Standing[];
  initialNonTopCount: number;
};

export function LeaderboardLive({ initialStandings, initialNonTopCount }: Props) {
  const [top, setTop] = useState<Standing[]>(initialStandings);
  const [other, setOther] = useState<number>(initialNonTopCount);

  useEffect(() => {
    const supabase = getBrowserSupabase();
    let cancelled = false;

    async function refresh() {
      const res = await fetch("/api/standings", { cache: "no-store" });
      if (!res.ok || cancelled) return;
      const data = (await res.json()) as {
        top: Standing[];
        otherCount: number;
      };
      setTop(data.top);
      setOther(data.otherCount);
    }

    // Subscribe to ballots; on any change, refetch top 3.
    const channel = supabase
      .channel("ballots-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ballots" },
        () => refresh(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "teams" },
        () => refresh(),
      )
      .subscribe();

    // Also poll every 15s as a belt-and-suspenders for closed networks.
    const interval = setInterval(refresh, 15000);

    return () => {
      cancelled = true;
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  if (top.length === 0) {
    return (
      <div className="card-dark p-10 text-center max-w-xl mx-auto">
        <span className="eyebrow">NO VOTES YET</span>
        <h2 className="text-[22px] font-semibold mt-2 text-text-on-dark">
          The leaderboard wakes up after the first ballot.
        </h2>
        <p className="mt-2 text-text-muted-dark">
          Once anyone votes, the top three appear here and refresh in realtime.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <ul
        role="list"
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        aria-live="polite"
      >
        {top.map((s) => (
          <li key={s.team_id} className="card-dark overflow-hidden animate-fade-in">
            <div className="relative w-full aspect-[16/9] bg-[#1a2128]">
              {s.thumbnail_url ? (
                <Image
                  src={s.thumbnail_url}
                  alt={`${s.name} preview`}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-text-muted-dark text-[12px] uppercase tracking-eyebrow">
                  No preview
                </div>
              )}
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-[20px] font-semibold leading-tight">
                  {s.name}
                </h3>
                <span className="text-liatrio-green font-semibold tabular-nums text-[20px]">
                  {s.pct.toFixed(1)}%
                </span>
              </div>
              <ProgressBar pct={s.pct} />
              {s.tagline && (
                <p className="text-[13px] text-text-muted-dark leading-[1.5]">
                  {s.tagline}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>

      {other > 0 && (
        <p className="text-center text-text-muted-dark text-[15px]">
          Plus {other} other amazing demos in the running 👏
        </p>
      )}
    </div>
  );
}

function ProgressBar({ pct }: { pct: number }) {
  const clamped = Math.max(2, Math.min(100, pct));
  return (
    <div className="h-3 w-full rounded-full bg-[#1a2128] overflow-hidden">
      <div
        className="h-full rounded-full"
        style={{
          width: `${clamped}%`,
          background:
            "linear-gradient(90deg, #00A0DC 0%, #A3E635 100%)",
          transition: "width 600ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  );
}
