"use client";

import { useEffect, useRef } from "react";
import clsx from "clsx";
import type { Team } from "@/types/db";
import { VOTES_REQUIRED } from "@/lib/constants";

type DemoModalTeam = Pick<
  Team,
  "id" | "name" | "tagline" | "members" | "summary" | "demo_url"
>;

export function DemoModal({
  team,
  selected,
  voteDisabled,
  showVote,
  onVote,
  onClose,
}: {
  team: DemoModalTeam;
  selected: boolean;
  voteDisabled: boolean;
  showVote: boolean;
  onVote?: () => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const titleId = `demo-modal-title-${team.id}`;

  // Capture and restore focus.
  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const t = window.setTimeout(() => {
      const node = dialogRef.current;
      if (!node) return;
      const first = node.querySelector<HTMLElement>(
        'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      );
      (first ?? node).focus();
    }, 0);
    return () => {
      window.clearTimeout(t);
      previouslyFocused.current?.focus?.();
    };
  }, []);

  // Esc + focus trap.
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const node = dialogRef.current;
      if (!node) return;
      const focusables = Array.from(
        node.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && (active === first || active === node)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Lock body scroll while open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  function handleVote(e: React.MouseEvent) {
    e.stopPropagation();
    if (voteDisabled || !onVote) return;
    onVote();
  }

  const voteLabel = voteDisabled
    ? `${VOTES_REQUIRED} votes used`
    : selected
    ? "Voted ✓ — Remove"
    : "Vote for this demo";
  const voteAria = voteDisabled
    ? `Cannot vote — ${VOTES_REQUIRED} votes already used`
    : selected
    ? "Remove vote for this team"
    : "Vote for this team";
  const hasSummary = !!team.summary && team.summary.trim().length > 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="card-dark w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 animate-slide-up outline-none focus:ring-2 focus:ring-liatrio-green/40"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <span className="eyebrow">DEMO DETAILS</span>
            <h2
              id={titleId}
              className="h-section mt-2 text-[24px] sm:text-[28px] text-text-on-dark"
            >
              {team.name}
            </h2>
            {team.tagline && (
              <p className="mt-2 text-text-muted-dark leading-[1.55]">
                {team.tagline}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close demo details"
            className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full border border-border-dark text-text-muted-dark hover:text-text-on-dark hover:border-liatrio-green transition-colors"
          >
            <span aria-hidden className="text-[20px] leading-none -mt-0.5">
              ×
            </span>
          </button>
        </div>

        {team.members.length > 0 && (
          <section className="mt-5">
            <p className="eyebrow">MEMBERS</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {team.members.map((m) => (
                <span key={m} className="chip chip-dark">
                  {m}
                </span>
              ))}
            </div>
          </section>
        )}

        {hasSummary && (
          <section className="mt-5">
            <p className="eyebrow">SUMMARY</p>
            <p className="mt-2 text-text-on-dark/90 leading-[1.6] whitespace-pre-line">
              {team.summary}
            </p>
          </section>
        )}

        <div className="mt-7 flex flex-wrap items-center gap-3">
          {team.demo_url && (
            <a
              href={team.demo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-blue"
            >
              Open demo ↗
            </a>
          )}
          {showVote && (
            <button
              type="button"
              onClick={handleVote}
              disabled={voteDisabled}
              aria-pressed={selected}
              aria-label={voteAria}
              className={clsx(
                "btn",
                selected
                  ? "bg-liatrio-green/15 text-liatrio-green border border-liatrio-green/40 hover:bg-liatrio-green/25 hover:border-liatrio-green"
                  : voteDisabled
                  ? "btn-secondary"
                  : "btn-blue",
              )}
            >
              {voteLabel}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary ml-auto"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
