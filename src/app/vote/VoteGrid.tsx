"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import { TeamCard } from "@/components/TeamCard";
import { toast } from "@/components/Toaster";
import { submitBallot } from "./actions";
import type { Team } from "@/types/db";
import { VOTES_REQUIRED } from "@/lib/constants";

export function VoteGrid({ teams }: { teams: Team[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);
  const [fingerprint, setFingerprint] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    FingerprintJS.load()
      .then((fp) => fp.get())
      .then((res) => {
        if (mounted) setFingerprint(res.visitorId);
      })
      .catch(() => {
        if (mounted) setFingerprint(`fallback-${crypto.randomUUID()}`);
      });
    return () => {
      mounted = false;
    };
  }, []);

  function toggle(id: string) {
    setSelected((cur) => {
      if (cur.includes(id)) return cur.filter((x) => x !== id);
      if (cur.length >= VOTES_REQUIRED) {
        toast(
          "info",
          `You can pick exactly ${VOTES_REQUIRED}. Tap a selected card to swap.`,
        );
        return cur;
      }
      return [...cur, id];
    });
  }

  const exactly3 = selected.length === VOTES_REQUIRED;
  const picksDetail = selected
    .map((id) => teams.find((t) => t.id === id))
    .filter(Boolean) as Team[];

  function onSubmit() {
    if (!exactly3) return;
    setShowConfirm(true);
  }

  function onConfirm() {
    if (!fingerprint) return;
    startTransition(async () => {
      const res = await submitBallot({
        teamIds: selected,
        fingerprint,
      });
      if (res.ok) {
        toast("success", "Your ballot is in. Thanks!");
        router.push("/thanks");
        router.refresh();
      } else {
        setShowConfirm(false);
        if (res.reason === "duplicate") {
          toast("info", "You've already voted. Thanks!");
          router.push("/thanks");
        } else if (res.reason === "voting_closed") {
          toast("error", "Voting just closed. Sorry!");
        } else if (res.reason === "rate_limited") {
          toast("error", "Too many ballots from this network — try later.");
        } else {
          toast("error", "Something went wrong. Try again in a moment.");
        }
      }
    });
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-text-muted-light text-[14px]">
            <span
              aria-live="polite"
              className="font-semibold text-natera-blue tabular-nums"
            >
              {selected.length}
            </span>{" "}
            of {VOTES_REQUIRED} picks selected
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={onSubmit}
          disabled={!exactly3 || pending || !fingerprint}
          aria-disabled={!exactly3 || pending || !fingerprint}
        >
          {pending ? "Submitting…" : "Submit ballot →"}
        </button>
      </header>

      {teams.length === 0 ? (
        <EmptyState />
      ) : (
        <ul
          role="listbox"
          aria-label="Hackathon teams; pick exactly three"
          aria-multiselectable="true"
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {teams.map((t) => (
            <li key={t.id}>
              <TeamCard
                team={t}
                variant="light"
                selected={selected.includes(t.id)}
                onToggle={() => toggle(t.id)}
                showOpenLink
              />
            </li>
          ))}
        </ul>
      )}

      {showConfirm && (
        <ConfirmModal
          picks={picksDetail}
          onCancel={() => setShowConfirm(false)}
          onConfirm={onConfirm}
          pending={pending}
        />
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="card-light p-10 text-center max-w-xl mx-auto">
      <span className="eyebrow">NO TEAMS YET</span>
      <h2 className="text-[22px] font-semibold mt-2">
        Voting can't start without teams.
      </h2>
      <p className="mt-2 text-text-muted-light">
        Once captains register, their demos show up here.
      </p>
    </div>
  );
}

function ConfirmModal({
  picks,
  onCancel,
  onConfirm,
  pending,
}: {
  picks: Team[];
  onCancel: () => void;
  onConfirm: () => void;
  pending: boolean;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-4 bg-black/50 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="card-light w-full max-w-md p-6 sm:p-8 animate-slide-up">
        <span className="eyebrow">CONFIRM YOUR BALLOT</span>
        <h2 id="confirm-title" className="h-section mt-2 text-[24px] sm:text-[28px]">
          You're voting for{" "}
          <span className="h-emphasis">these three.</span>
        </h2>
        <p className="mt-3 text-text-muted-light">
          Once you confirm, your ballot is final.
        </p>
        <ul className="mt-5 space-y-2">
          {picks.map((p, i) => (
            <li
              key={p.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-[#eef2f7]"
            >
              <span className="text-natera-blue font-semibold tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="font-medium">{p.name}</span>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex gap-3 justify-end">
          <button
            type="button"
            className="btn btn-ghost-light"
            onClick={onCancel}
            disabled={pending}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onConfirm}
            disabled={pending}
          >
            {pending ? "Submitting…" : "Confirm and submit"}
          </button>
        </div>
      </div>
    </div>
  );
}
