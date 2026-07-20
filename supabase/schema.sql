-- AutoTrade Bot — Supabase schema
-- Run this in the Supabase SQL editor after creating the project.

-- OAuth token records (tokens stored AES-256-GCM encrypted by the app)
create table if not exists user_tokens (
  id uuid primary key default gen_random_uuid(),
  upstox_user_id varchar(255),
  user_name varchar(255),
  email varchar(255),
  token text,               -- encrypted, nullable if encryption not configured
  expires_at timestamptz,
  created_at timestamptz default now()
);

-- Trades (paper and live)
create table if not exists trades (
  id uuid primary key default gen_random_uuid(),
  upstox_user_id varchar(255),
  symbol varchar(20) not null,
  side varchar(10) not null,          -- LONG/SHORT
  order_type varchar(10) not null,    -- BUY/SELL
  quantity integer not null,
  entry_price numeric(12,2) not null,
  exit_price numeric(12,2),
  pnl numeric(12,2),
  mode varchar(10) not null default 'PAPER',  -- PAPER/LIVE
  upstox_order_id varchar(255),
  status varchar(20) not null default 'EXECUTED', -- PENDING/EXECUTED/CANCELLED
  entry_time timestamptz default now(),
  exit_time timestamptz
);

-- Activity log
create table if not exists activity_logs (
  id uuid primary key default gen_random_uuid(),
  upstox_user_id varchar(255),
  action varchar(50) not null,
  details jsonb,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_trades_user on trades (upstox_user_id, entry_time desc);
create index if not exists idx_logs_user on activity_logs (upstox_user_id, created_at desc);

-- Row Level Security: locked down; the app uses the service-role key server-side.
alter table user_tokens enable row level security;
alter table trades enable row level security;
alter table activity_logs enable row level security;
