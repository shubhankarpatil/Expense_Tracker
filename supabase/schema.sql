-- Run this in your Supabase project's SQL Editor (Dashboard > SQL Editor > New query)

-- Enable RLS on auth.users already done by Supabase.

-- budgets
create table if not exists public.budgets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  monthly_limit numeric,
  updated_at  timestamptz default now(),
  unique (user_id)
);

alter table public.budgets enable row level security;

create policy "Users manage their own budget"
  on public.budgets
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- sheet_configs
create table if not exists public.sheet_configs (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  sheet_id       text not null,
  sheet_url      text not null,
  last_synced_at timestamptz,
  unique (user_id)
);

alter table public.sheet_configs enable row level security;

create policy "Users manage their own sheet config"
  on public.sheet_configs
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Auto-create rows on first sign-in via a DB function + trigger
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.budgets (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
