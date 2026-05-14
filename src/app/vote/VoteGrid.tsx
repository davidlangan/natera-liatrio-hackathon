"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import { TeamCard } from "@/components/TeamCard";
import { toast } from "@/components/Toaster";
import { submitBallot } from "./actions";
import type { Team } from "@/types/db";
import { VOTES_REQUIRED } from "@/lib/constants";
import { DemoModal } from "./DemoModal";

export function VoteGrid({ teams }: { teams: Team[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);
  const [fingerprint, setFingerprint] = useState<string | null>(null);
  const [openTeamId, setOpenTeamId] = useState<string | null>(null);

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

  const remaining = VOTES_REQUIRED - selected.length;
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
        // Use a full navigation after the server action sets httpOnly cookies.
        // This avoids occasional client-router races where the ballot records
        // successfully but the voter remains visually stranded on /vote.
        window.location.assign("/thanks");
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
      {/* Sticky live counter that follows the user down the page */}
      <div className="sticky top-0 z-30 -mx-6 px-6 py-3 backdrop-blur-md bg-[rgba(10,14,20,0.78)] border-b border-border-dark/60">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <CounterPill selected={selected.length} />
            <span
              aria-live="polite"
              className="text-[14px] text-text-muted-dark"
            >
              {exactly3 ? (
                <span className="text-liatrio-green font-semibold">
                  Ready to submit ↓
                </span>
              ) : remaining === VOTES_REQUIRED ? (
                "Open a card to read details, then tap Vote."
              ) : (
                <>
                  Pick{" "}
                  <span className="text-text-on-dark font-semibold tabular-nums">
                    {remaining}
                  </span>{" "}
                  more
                </>
              )}
            </span>
          </div>
          <button
            type="button"
            className="btn btn-blue"
            onClick={onSubmit}
            disabled={!exactly3 || pending || !fingerprint}
            aria-disabled={!exactly3 || pending || !fingerprint}
          >
            {pending
              ? "Submitting…"
              : exactly3
              ? "Submit ballot →"
              : `Pick ${remaining} more`}
          </button>
        </div>
      </div>

      {/* Big starting prompt above the grid */}
      <div className="card-dark p-6 sm:p-7 flex flex-wrap items-center gap-5">
        <BigCount selected={selected.length} />
        <div className="min-w-0 flex-1">
          <p className="text-[15px] text-text-muted-dark uppercase tracking-eyebrow font-semibold">
            {exactly3 ? "Your ballot is ready" : "Votes remaining"}
          </p>
          <p className="text-text-on-dark text-[18px] sm:text-[20px] font-semibold mt-1 leading-snug">
            {exactly3
              ? "You've picked three. Submit when you're sure — votes are final."
              : remaining === VOTES_REQUIRED
              ? "You have 3 votes. Open a demo card to read details, then tap Vote."
              : `${remaining} ${remaining === 1 ? "vote" : "votes"} left — keep picking.`}
          </p>
        </div>
      </div>

      {teams.length === 0 ? (
        <EmptyState />
      ) : (
        <ul
          role="listbox"
          aria-label="Hackathon teams; pick exactly three"
          aria-multiselectable="true"
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {teams.map((t) => {
            const idx = selected.indexOf(t.id);
            const isSelected = idx !== -1;
            const voteDisabled =
              !isSelected && selected.length >= VOTES_REQUIRED;
            return (
              <li key={t.id}>
                <TeamCard
                  team={t}
                  variant="dark"
                  selected={isSelected}
                  selectionIndex={isSelected ? idx + 1 : undefined}
                  selectionTotal={VOTES_REQUIRED}
                  onOpen={() => setOpenTeamId(t.id)}
                  onVote={() => toggle(t.id)}
                  voteDisabled={voteDisabled}
                  showOpenLink
                />
              </li>
            );
          })}
        </ul>
      )}

      {openTeamId &&
        (() => {
          const team = teams.find((t) => t.id === openTeamId);
          if (!team) return null;
          const isSelected = selected.includes(team.id);
          const voteDisabled =
            !isSelected && selected.length >= VOTES_REQUIRED;
          return (
            <DemoModal
              team={team}
              selected={isSelected}
              voteDisabled={voteDisabled}
              showVote
              onVote={() => toggle(team.id)}
              onClose={() => setOpenTeamId(null)}
            />
          );
        })()}

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

function CounterPill({ selected }: { selected: number }) {
  const remaining = VOTES_REQUIRED - selected;
  const done = remaining === 0;
  return (
    <span
      aria-live="polite"
      className={
        done
          ? "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[13px] font-bold bg-liatrio-green text-bg-dark"
          : "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[13px] font-bold bg-surface-dark border border-border-dark text-text-on-dark"
      }
    >
      <span className="tabular-nums">
        {selected}/{VOTES_REQUIRED}
      </span>
      <span className="uppercase tracking-eyebrow text-[11px] opacity-80">
        picks
      </span>
    </span>
  );
}

function BigCount({ selected }: { selected: number }) {
  const remaining = VOTES_REQUIRED - selected;
  return (
    <div className="flex items-baseline gap-1">
      <span className="text-[64px] sm:text-[72px] font-black leading-none tabular-nums text-liatrio-green">
        {remaining}
      </span>
      <span className="text-text-muted-dark text-[18px] font-semibold tabular-nums">
        /{VOTES_REQUIRED}
      </span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="card-dark p-10 text-center max-w-xl mx-auto">
      <span className="eyebrow">NO TEAMS YET</span>
      <h2 className="text-[22px] font-semibold mt-2 text-text-on-dark">
        Voting can't start without teams.
      </h2>
      <p className="mt-2 text-text-muted-dark">
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
      className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="card-dark w-full max-w-md p-6 sm:p-8 animate-slide-up">
        <span className="eyebrow">CONFIRM YOUR BALLOT</span>
        <h2
          id="confirm-title"
          className="h-section mt-2 text-[24px] sm:text-[28px] text-text-on-dark"
        >
          You're voting for{" "}
          <span className="h-emphasis">these three.</span>
        </h2>
        <p className="mt-3 text-text-muted-dark leading-[1.55]">
          All submissions are final. You won't be able to change your vote
          after this. Confirm?
        </p>
        <ul className="mt-5 space-y-2">
          {picks.map((p, i) => (
            <li
              key={p.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-surface-dark-2 border border-border-dark"
            >
              <span className="text-liatrio-green font-bold tabular-nums text-[18px] leading-none">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="font-medium text-text-on-dark">{p.name}</span>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex gap-3 justify-end">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={pending}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-blue"
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
