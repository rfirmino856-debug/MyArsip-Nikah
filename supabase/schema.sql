create extension if not exists pgcrypto;

create table if not exists public.arsip_nikah (
  id text primary key,
  data jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.arsip_nikah enable row level security;

drop policy if exists "Allow authenticated read access" on public.arsip_nikah;
create policy "Allow authenticated read access"
  on public.arsip_nikah
  for select
  using (auth.uid() is not null);

drop policy if exists "Allow authenticated insert access" on public.arsip_nikah;
create policy "Allow authenticated insert access"
  on public.arsip_nikah
  for insert
  with check (auth.uid() is not null);

drop policy if exists "Allow authenticated update access" on public.arsip_nikah;
create policy "Allow authenticated update access"
  on public.arsip_nikah
  for update
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

drop policy if exists "Allow authenticated delete access" on public.arsip_nikah;
create policy "Allow authenticated delete access"
  on public.arsip_nikah
  for delete
  using (auth.uid() is not null);

create index if not exists idx_arsip_nikah_updated_at
  on public.arsip_nikah(updated_at desc);
