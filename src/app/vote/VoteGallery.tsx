"use client";

import { useState } from "react";
import { TeamCard } from "@/components/TeamCard";
import { DemoModal } from "./DemoModal";
import type { Team } from "@/types/db";

/**
 * Read-only browse mode shown on /vote when voting is closed. Cards still open
 * the demo detail modal so visitors can read full team info, but no Vote
 * button renders and the modal hides its vote action.
 */
export function VoteGallery({ teams }: { teams: Team[] }) {
  const [openTeamId, setOpenTeamId] = useState<string | null>(null);

  if (teams.length === 0) {
    return (
      <div className="card-dark p-10 text-center max-w-xl mx-auto">
        <span className="eyebrow">NO TEAMS YET</span>
        <h2 className="text-[22px] font-semibold mt-2 text-text-on-dark">
          The gallery's quiet — for now.
        </h2>
        <p className="mt-2 text-text-muted-dark">
          Once captains register, their demos show up here.
        </p>
      </div>
    );
  }

  const openTeam = openTeamId
    ? teams.find((t) => t.id === openTeamId) ?? null
    : null;

  return (
    <>
      <ul role="list" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {teams.map((t) => (
          <li key={t.id}>
            <TeamCard
              team={t}
              variant="dark"
              onOpen={() => setOpenTeamId(t.id)}
              showOpenLink
            />
          </li>
        ))}
      </ul>
      {openTeam && (
        <DemoModal
          team={openTeam}
          selected={false}
          voteDisabled={false}
          showVote={false}
          onClose={() => setOpenTeamId(null)}
        />
      )}
    </>
  );
}
