-- Run this in your Supabase SQL editor

create table users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  avatar_url text,
  plan text default 'free',
  renders_used int default 0,
  renders_limit int default 0,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table renders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  original_url text,
  staged_url text,
  room_type text,
  style text,
  status text default 'processing', -- processing | completed | failed
  error_message text,
  created_at timestamptz default now()
);

-- Storage bucket (also create in Supabase dashboard > Storage)
-- Bucket name: renders
-- Public: true (so images are accessible via URL)

-- Index for fast lookups
create index on renders(user_id);
create index on users(email);
create index on users(stripe_subscription_id);
