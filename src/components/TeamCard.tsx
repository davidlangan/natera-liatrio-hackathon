"use client";

import Image from "next/image";
import clsx from "clsx";
import type { Team } from "@/types/db";

export function TeamCard({
  team,
  variant = "light",
  selected = false,
  onToggle,
  showOpenLink = false,
  tabIndex,
}: {
  team: Pick<
    Team,
    "id" | "name" | "tagline" | "members" | "demo_url" | "thumbnail_url" | "summary"
  >;
  variant?: "light" | "dark";
  selected?: boolean;
  onToggle?: () => void;
  showOpenLink?: boolean;
  tabIndex?: number;
}) {
  const interactive = !!onToggle;
  const Wrapper: "button" | "div" = interactive ? "button" : "div";

  return (
    <Wrapper
      type={interactive ? "button" : undefined}
      onClick={onToggle}
      aria-pressed={interactive ? selected : undefined}
      tabIndex={tabIndex}
      className={clsx(
        "group text-left w-full transition-all duration-150",
        variant === "light" ? "card-light" : "card-dark",
        interactive && "cursor-pointer hover:-translate-y-0.5",
        interactive &&
          selected &&
          "ring-2 ring-liatrio-green ring-offset-2 ring-offset-bg-light shadow-[0_8px_30px_rgba(163,230,53,0.15)]",
      )}
    >
      <Thumbnail
        url={team.thumbnail_url}
        alt={`${team.name} demo preview`}
        variant={variant}
      />
      <div className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <h3
            className={clsx(
              "text-[18px] font-semibold leading-tight",
              variant === "light" ? "text-text-on-light" : "text-text-on-dark",
            )}
          >
            {team.name}
          </h3>
          {interactive && (
            <span
              aria-hidden
              className={clsx(
                "shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full border transition-colors",
                selected
                  ? "bg-liatrio-green border-liatrio-green text-bg-dark"
                  : variant === "light"
                  ? "border-border-light text-transparent"
                  : "border-border-dark text-transparent",
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
              variant === "light"
                ? "text-text-muted-light"
                : "text-text-muted-dark",
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
                variant === "light"
                  ? "bg-[#eef2f7] text-text-on-light"
                  : "bg-[#1a2128] text-text-muted-dark",
              )}
            >
              {m}
            </span>
          ))}
          {team.members.length > 6 && (
            <span
              className={clsx(
                "px-2 py-0.5 rounded-full text-[12px]",
                variant === "light"
                  ? "text-text-muted-light"
                  : "text-text-muted-dark",
              )}
            >
              +{team.members.length - 6} more
            </span>
          )}
        </div>
        {showOpenLink && (
          <a
            href={team.demo_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={clsx(
              "inline-flex items-center gap-1 text-[14px] font-medium",
              variant === "light"
                ? "text-natera-blue hover:text-natera-blue-deep"
                : "text-natera-blue hover:text-liatrio-green",
            )}
          >
            Open demo ↗
          </a>
        )}
      </div>
    </Wrapper>
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
