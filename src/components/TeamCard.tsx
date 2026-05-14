"use client";

import Image from "next/image";
import clsx from "clsx";
import type { Team } from "@/types/db";
import { VOTES_REQUIRED } from "@/lib/constants";

type TeamCardData = Pick<
  Team,
  "id" | "name" | "tagline" | "members" | "demo_url" | "thumbnail_url" | "summary"
>;

export function TeamCard({
  team,
  variant = "light",
  selected = false,
  selectionIndex,
  selectionTotal,
  onOpen,
  onVote,
  voteDisabled = false,
  showOpenLink = false,
  tabIndex,
}: {
  team: TeamCardData;
  variant?: "light" | "dark";
  selected?: boolean;
  /** 1-based position of this card in the user's current picks. */
  selectionIndex?: number;
  /** Total picks required (denominator on the badge). */
  selectionTotal?: number;
  /** Click on the card surface (anywhere outside the Vote button) opens the demo detail modal. */
  onOpen?: () => void;
  /** Click on the bottom Vote button toggles the team in the user's ballot. */
  onVote?: () => void;
  /** True when this card is unselected AND the user has already used all picks. */
  voteDisabled?: boolean;
  showOpenLink?: boolean;
  tabIndex?: number;
}) {
  const interactive = !!onOpen;
  const isDark = variant === "dark";
  const showVote = !!onVote;

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!interactive) return;
    e.currentTarget.focus();
    onOpen?.();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (!interactive) return;
    if (e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpen?.();
    }
  }

  function handleVoteClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (!onVote) return;
    if (voteDisabled) return;
    onVote();
  }

  return (
    <div
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? tabIndex ?? 0 : undefined}
      onClick={interactive ? handleClick : undefined}
      onKeyDown={interactive ? handleKeyDown : undefined}
      aria-label={interactive ? `${team.name} — open demo details` : undefined}
      className={clsx(
        "group relative text-left w-full transition-all duration-150",
        isDark ? "card-dark" : "card-light",
        interactive && "cursor-pointer hover:-translate-y-0.5",
        showVote &&
          selected &&
          (isDark
            ? "ring-2 ring-liatrio-green ring-offset-2 ring-offset-bg-dark shadow-[0_10px_40px_-6px_rgba(163,230,53,0.35)]"
            : "ring-2 ring-liatrio-green ring-offset-2 ring-offset-bg-light shadow-[0_8px_30px_rgba(163,230,53,0.15)]"),
      )}
    >
      <Thumbnail
        url={team.thumbnail_url}
        alt={`${team.name} demo preview`}
        variant={variant}
      />
      {showVote && selected && selectionIndex && selectionTotal && (
        <span
          aria-hidden
          className="absolute top-3 left-3 inline-flex items-center justify-center min-w-[44px] h-7 px-2.5 rounded-full bg-liatrio-green text-bg-dark text-[13px] font-bold tabular-nums tracking-tight shadow-[0_4px_14px_rgba(163,230,53,0.5)]"
        >
          {selectionIndex}/{selectionTotal}
        </span>
      )}
      <div className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <h3
            className={clsx(
              "text-[18px] font-semibold leading-tight",
              isDark ? "text-text-on-dark" : "text-text-on-light",
            )}
          >
            {team.name}
          </h3>
          {showVote && (
            <span
              aria-hidden
              className={clsx(
                "shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full border transition-colors",
                selected
                  ? "bg-liatrio-green border-liatrio-green text-bg-dark"
                  : isDark
                  ? "border-border-dark text-transparent group-hover:border-liatrio-green/60"
                  : "border-border-light text-transparent group-hover:border-liatrio-green/60",
              )}
            >
              ✓
            </span>
          )}
        </div>
        {team.tagline && (
          <p
            className={clsx(
              "text-[14px] leading-[1.5]",
              isDark ? "text-text-muted-dark" : "text-text-muted-light",
            )}
          >
            {team.tagline}
          </p>
        )}
        <div className="flex flex-wrap gap-1.5">
          {team.members.slice(0, 6).map((m) => (
            <span
              key={m}
              className={clsx(
                "px-2 py-0.5 rounded-full text-[12px]",
                isDark
                  ? "bg-[#1a2128] text-text-muted-dark"
                  : "bg-[#eef2f7] text-text-on-light",
              )}
            >
              {m}
            </span>
          ))}
          {team.members.length > 6 && (
            <span
              className={clsx(
                "px-2 py-0.5 rounded-full text-[12px]",
                isDark ? "text-text-muted-dark" : "text-text-muted-light",
              )}
            >
              +{team.members.length - 6} more
            </span>
          )}
        </div>
        {showOpenLink && team.demo_url && (
          <a
            href={team.demo_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={clsx(
              "inline-flex items-center gap-1 text-[14px] font-medium",
              isDark
                ? "text-natera-blue hover:text-liatrio-green"
                : "text-natera-blue hover:text-natera-blue-deep",
            )}
          >
            Open demo ↗
          </a>
        )}
        {showVote && (
          <VoteButton
            selected={selected}
            disabled={voteDisabled}
            onClick={handleVoteClick}
          />
        )}
      </div>
    </div>
  );
}

function VoteButton({
  selected,
  disabled,
  onClick,
}: {
  selected: boolean;
  disabled: boolean;
  onClick: (e: React.MouseEvent) => void;
}) {
  const label = disabled
    ? `${VOTES_REQUIRED} votes used`
    : selected
    ? "Voted ✓ — Remove"
    : "Vote";
  const ariaLabel = disabled
    ? `Cannot vote — ${VOTES_REQUIRED} votes already used`
    : selected
    ? "Remove vote for this team"
    : "Vote for this team";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      aria-label={ariaLabel}
      className={clsx(
        "btn w-full mt-1",
        selected
          ? "bg-liatrio-green/15 text-liatrio-green border border-liatrio-green/40 hover:bg-liatrio-green/25 hover:border-liatrio-green"
          : disabled
          ? "btn-secondary"
          : "btn-blue",
      )}
    >
      {label}
    </button>
  );
}

function Thumbnail({
  url,
  alt,
  variant,
}: {
  url: string | null;
  alt: string;
  variant: "light" | "dark";
}) {
  return (
    <div
      className={clsx(
        "relative w-full aspect-[16/9] rounded-t-card overflow-hidden",
        variant === "light" ? "bg-[#eef2f7]" : "bg-[#1a2128]",
      )}
    >
      {url ? (
        <Image
          src={url}
          alt={alt}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-text-muted-light text-[12px] uppercase tracking-eyebrow">
          No preview
        </div>
      )}
    </div>
  );
}

export function TeamCardSkeleton({
  variant = "light",
}: {
  variant?: "light" | "dark";
}) {
  return (
    <div className={variant === "light" ? "card-light" : "card-dark"}>
      <div
        className={`w-full aspect-[16/9] rounded-t-card ${
          variant === "light" ? "skeleton-light" : "skeleton"
        }`}
      />
      <div className="p-5 space-y-3">
        <div
          className={`h-5 w-2/3 ${variant === "light" ? "skeleton-light" : "skeleton"}`}
        />
        <div
          className={`h-4 w-full ${variant === "light" ? "skeleton-light" : "skeleton"}`}
        />
        <div
          className={`h-4 w-1/2 ${variant === "light" ? "skeleton-light" : "skeleton"}`}
        />
      </div>
    </div>
  );
}
