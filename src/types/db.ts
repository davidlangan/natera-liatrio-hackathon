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
  demo_url: string;
  tagline: string | null;
  thumbnail_url: string | null;
  summary: string | null;
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
  demo_url: string;
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
