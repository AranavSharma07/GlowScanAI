-- Run this SQL in the Supabase SQL Editor before deploying.
create table if not exists public.leaderboard_entries (
  id uuid primary key default gen_random_uuid(),
  display_name text not null check (char_length(display_name) between 1 and 32),
  score integer not null check (score between 0 and 100),
  certificate_eligible boolean not null default false,
  token_nonce text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists leaderboard_score_rank_idx
  on public.leaderboard_entries (score desc, certificate_eligible desc, created_at asc);

-- All access goes through server API routes using the service-role key.
-- Keep RLS enabled and do not add public SELECT/INSERT policies.
alter table public.leaderboard_entries enable row level security;
