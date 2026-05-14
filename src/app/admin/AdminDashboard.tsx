"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import {
  deleteTeam,
  logoutAction,
  resetEverything,
  setRegistrationOpen,
  setVotingClosesAt,
  setVotingOpen,
  updateTeam,
} from "./actions";
import { toast } from "@/components/Toaster";
import type { Settings, Team, FraudEntry } from "@/types/db";

type Row = Team & { votes: number };

export function AdminDashboard({
  settings,
  rows,
  totalBallots,
  fraud,
}: {
  settings: Settings | null;
  rows: Row[];
  totalBallots: number;
  fraud: FraudEntry[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [datetime, setDatetime] = useState<string>(() => {
    if (!settings?.voting_closes_at) return "";
    const d = new Date(settings.voting_closes_at);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
      d.getDate(),
    )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });

  function flipReg() {
    startTransition(async () => {
      await setRegistrationOpen(!(settings?.registration_open ?? false));
      toast("success", "Registration toggled.");
      router.refresh();
    });
  }
  function flipVote() {
    startTransition(async () => {
      await setVotingOpen(!(settings?.voting_open ?? false));
      toast("success", "Voting toggled.");
      router.refresh();
    });
  }
  function saveClosesAt() {
    startTransition(async () => {
      const iso = datetime ? new Date(datetime).toISOString() : null;
      await setVotingClosesAt(iso);
      toast("success", iso ? "Auto-close scheduled." : "Auto-close cleared.");
      router.refresh();
    });
  }
  function clearCloseAt() {
    setDatetime("");
    startTransition(async () => {
      await setVotingClosesAt(null);
      toast("success", "Auto-close cleared.");
      router.refresh();
    });
  }

  function onDelete(team: Row) {
    if (!confirm(`Delete "${team.name}"? This removes their ballots too.`)) return;
    startTransition(async () => {
      await deleteTeam(team.id);
      toast("success", "Team deleted.");
      router.refresh();
    });
  }

  function onReset() {
    const msg =
      "Reset EVERYTHING: ballots, teams, fraud log, and settings. This cannot be undone. Type RESET to confirm.";
    const v = prompt(msg);
    if (v !== "RESET") return;
    startTransition(async () => {
      await resetEverything();
      toast("success", "Wiped and reset.");
      router.refresh();
    });
  }

  function exportCsv() {
    window.open("/api/admin/export", "_blank");
  }

  return (
    <div className="space-y-10">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <span className="eyebrow-strong">ADMIN</span>
          <h1 className="h-display text-text-on-dark mt-2 text-[40px] sm:text-[48px]">
            Run the <span className="h-emphasis">event.</span>
          </h1>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/leaderboard" className="btn btn-primary">
            View leaderboard →
          </Link>
          <form action={logoutAction}>
            <button type="submit" className="btn btn-secondary">
              Sign out
            </button>
          </form>
        </div>
      </header>

      {/* Switches */}
      <section className="grid gap-4 md:grid-cols-3">
        <Toggle
          label="Registration"
          on={settings?.registration_open ?? false}
          onClick={flipReg}
          disabled={pending}
        />
        <Toggle
          label="Voting"
          on={settings?.voting_open ?? false}
          onClick={flipVote}
          disabled={pending}
        />
        <div className="card-dark p-5">
          <p className="eyebrow">VOTING AUTO-CLOSE</p>
          <input
            type="datetime-local"
            value={datetime}
            onChange={(e) => setDatetime(e.target.value)}
            className="input-dark mt-3"
          />
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={saveClosesAt}
              disabled={pending}
              className="btn btn-blue text-[13px] py-2 px-3"
            >
              Save
            </button>
            <button
              type="button"
              onClick={clearCloseAt}
              disabled={pending}
              className="btn btn-secondary text-[13px] py-2 px-3"
            >
              Clear
            </button>
          </div>
          {settings?.voting_closes_at && (
            <p className="mt-2 text-[12px] text-text-muted-dark">
              Closes:{" "}
              {new Date(settings.voting_closes_at).toLocaleString()}
            </p>
          )}
        </div>
      </section>

      <section className="card-dark p-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="eyebrow">STANDINGS</p>
            <h2 className="text-[22px] font-semibold mt-1">
              All teams ({rows.length}) · {totalBallots} ballots cast
            </h2>
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn btn-blue" onClick={exportCsv}>
              Export CSV
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onReset}
              disabled={pending}
            >
              Reset event
            </button>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-[14px] min-w-[640px]">
            <thead>
              <tr className="text-left text-text-muted-dark text-[12px] uppercase tracking-eyebrow">
                <th className="py-2 pr-4">Team</th>
                <th className="py-2 pr-4">Members</th>
                <th className="py-2 pr-4">Demo</th>
                <th className="py-2 pr-4 text-right">Votes</th>
                <th className="py-2 pr-4">Registered</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <Row
                  key={r.id}
                  row={r}
                  pending={pending}
                  onDelete={() => onDelete(r)}
                  onEdit={async (patch) => {
                    startTransition(async () => {
                      await updateTeam({ id: r.id, ...patch });
                      toast("success", "Team updated.");
                      router.refresh();
                    });
                  }}
                />
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-text-muted-dark">
                    No teams yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card-dark p-6">
        <p className="eyebrow">ANTI-FRAUD LOG</p>
        <h2 className="text-[22px] font-semibold mt-1">
          Recent blocked attempts ({fraud.length})
        </h2>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-[13px] min-w-[640px]">
            <thead>
              <tr className="text-left text-text-muted-dark text-[12px] uppercase tracking-eyebrow">
                <th className="py-2 pr-4">When</th>
                <th className="py-2 pr-4">Reason</th>
                <th className="py-2 pr-4">Fingerprint (hash)</th>
                <th className="py-2 pr-4">IP (hash)</th>
                <th className="py-2 pr-4">Collided with</th>
              </tr>
            </thead>
            <tbody>
              {fraud.map((f) => (
                <tr key={f.id} className="border-t border-border-dark">
                  <td className="py-2 pr-4 text-text-muted-dark whitespace-nowrap">
                    {new Date(f.attempted_at).toLocaleString()}
                  </td>
                  <td className="py-2 pr-4">{f.reason}</td>
                  <td className="py-2 pr-4 font-mono text-[12px]">
                    {f.fingerprint_hash?.slice(0, 12) ?? "—"}
                  </td>
                  <td className="py-2 pr-4 font-mono text-[12px]">
                    {f.ip_hash?.slice(0, 12) ?? "—"}
                  </td>
                  <td className="py-2 pr-4 font-mono text-[12px]">
                    {f.collided_with_ballot_id?.slice(0, 8) ?? "—"}
                  </td>
                </tr>
              ))}
              {fraud.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-text-muted-dark">
                    Nothing here yet. Clean event.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Toggle({
  label,
  on,
  onClick,
  disabled,
}: {
  label: string;
  on: boolean;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "card-dark p-5 text-left transition-colors",
        on && "border-liatrio-green/40",
      )}
      aria-pressed={on}
    >
      <p className="eyebrow">{label.toUpperCase()}</p>
      <p
        className={clsx(
          "mt-3 text-[28px] font-semibold",
          on ? "text-liatrio-green" : "text-text-muted-dark",
        )}
      >
        {on ? "Open" : "Closed"}
      </p>
      <p className="mt-1 text-[12px] text-text-muted-dark">
        Click to flip the switch.
      </p>
    </button>
  );
}

function Row({
  row,
  pending,
  onDelete,
  onEdit,
}: {
  row: Row;
  pending: boolean;
  onDelete: () => void;
  onEdit: (patch: {
    name?: string;
    tagline?: string | null;
    demo_url?: string | null;
    thumbnail_url?: string | null;
  }) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(row.name);
  const [tagline, setTagline] = useState(row.tagline ?? "");
  const [url, setUrl] = useState(row.demo_url ?? "");
  const [thumb, setThumb] = useState(row.thumbnail_url ?? "");

  return (
    <tr className="border-t border-border-dark align-top">
      <td className="py-3 pr-4 font-medium">
        {editing ? (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-dark text-[13px] py-1.5"
          />
        ) : (
          row.name
        )}
        {editing && (
          <input
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            className="input-dark text-[12px] py-1 mt-1"
            placeholder="tagline"
          />
        )}
      </td>
      <td className="py-3 pr-4 text-text-muted-dark">
        {row.members.slice(0, 4).join(", ")}
        {row.members.length > 4 && ` +${row.members.length - 4}`}
      </td>
      <td className="py-3 pr-4 max-w-[280px]">
        {editing ? (
          <div className="space-y-2">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Demo URL (optional)"
              className="input-dark text-[13px] py-1.5"
            />
            <input
              value={thumb}
              onChange={(e) => setThumb(e.target.value)}
              placeholder="Thumbnail URL (optional) — e.g. /thumbnails/foo.png"
              className="input-dark text-[12px] py-1.5"
            />
          </div>
        ) : row.demo_url ? (
          <a
            href={row.demo_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-natera-blue hover:underline break-all"
          >
            {row.demo_url}
          </a>
        ) : (
          <span className="text-text-muted-dark">—</span>
        )}
      </td>
      <td className="py-3 pr-4 text-right tabular-nums text-liatrio-green font-semibold">
        {row.votes}
      </td>
      <td className="py-3 pr-4 text-text-muted-dark whitespace-nowrap">
        {new Date(row.created_at).toLocaleDateString()}
      </td>
      <td className="py-3">
        <div className="flex gap-2 justify-end">
          {editing ? (
            <>
              <button
                className="btn btn-blue text-[12px] py-1.5 px-3"
                disabled={pending}
                onClick={() => {
                  onEdit({
                    name,
                    tagline: tagline || null,
                    demo_url: url.trim() ? url.trim() : null,
                    thumbnail_url: thumb.trim() ? thumb.trim() : null,
                  });
                  setEditing(false);
                }}
              >
                Save
              </button>
              <button
                className="btn btn-secondary text-[12px] py-1.5 px-3"
                onClick={() => setEditing(false)}
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                className="btn btn-secondary text-[12px] py-1.5 px-3"
                onClick={() => setEditing(true)}
              >
                Edit
              </button>
              <button
                className="btn btn-secondary text-[12px] py-1.5 px-3"
                disabled={pending}
                onClick={onDelete}
              >
                Delete
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
