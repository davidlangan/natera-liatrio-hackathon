export type Settings = {
  id: boolean;
  registration_open: boolean;
  voting_open: boolean;
  voting_closes_at: string | null;
  updated_at: string;
};

export type Team = {
  id: string;
  name: string;
  members: string[];
  demo_url: string | null;
  /**
   * Legacy short label kept for back-compat with rows registered before the
   * Demo Summary textarea replaced the tagline field. New submissions leave
   * this null and rely on `summary` (truncated for cards, full in the modal).
   */
  tagline: string | null;
  thumbnail_url: string | null;
  summary: string | null;
  /** Captain marked the demo as in-person rather than supplying a URL. */
  running_locally: boolean;
  captain_token: string | null;
  created_at: string;
  updated_at: string;
};

export type Ballot = {
  id: string;
  team_id_1: string;
  team_id_2: string;
  team_id_3: string;
  fingerprint_hash: string;
  ip_hash: string;
  user_agent: string | null;
  created_at: string;
};

export type Standing = {
  team_id: string;
  name: string;
  tagline: string | null;
  thumbnail_url: string | null;
  demo_url: string | null;
  votes: number;
  pct: number;
};

export type FraudEntry = {
  id: string;
  fingerprint_hash: string | null;
  ip_hash: string | null;
  user_agent: string | null;
  reason: string;
  collided_with_ballot_id: string | null;
  attempted_at: string;
};
