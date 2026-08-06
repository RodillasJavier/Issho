-- supabase/tests/harness.sql
--
-- The parts of a Supabase database that the schema depends on but that live
-- outside `public`: the auth roles, `auth.users`, and the `auth.uid()` helper
-- every RLS policy is written against.
--
-- This exists so the policies can be tested against plain Postgres. The full
-- local stack (Kong, GoTrue, PostgREST, Studio) adds a lot of moving parts and
-- none of them are where the risk is — the risk is in the policy predicates,
-- and those are pure SQL. Testing them here keeps the suite fast and lets CI
-- use a stock `postgres` service container.
--
-- `auth.uid()` is reproduced faithfully: Supabase reads the user id out of the
-- request's JWT claims, which are carried in the `request.jwt.claims` GUC. A
-- test impersonates someone by setting that GUC and the role, exactly as
-- PostgREST does per request.

create schema if not exists auth;

-- Supabase's three API roles. `authenticated` and `anon` are what RLS
-- policies name; service_role bypasses RLS and is what the seed runs as.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin noinherit bypassrls;
  end if;
end
$$;

grant usage on schema public to anon, authenticated, service_role;

-- Deliberately NOT reproducing Supabase's default privileges on `public`
-- (which grant ALL on new objects to anon and authenticated). The baseline
-- states its grants explicitly, and emulating the defaults here would mask a
-- missing one — a test would pass locally and the app would 403 against a real
-- Supabase. Whatever the baseline does not grant, these roles do not get.

create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  created_at timestamptz not null default now()
);

grant usage on schema auth to anon, authenticated, service_role;

create or replace function auth.jwt()
returns jsonb
language sql
stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true), ''),
    '{}'
  )::jsonb;
$$;

create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(auth.jwt() ->> 'sub', '')::uuid;
$$;

create or replace function auth.role()
returns text
language sql
stable
as $$
  select auth.jwt() ->> 'role';
$$;

grant execute on function auth.jwt() to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;
grant execute on function auth.role() to anon, authenticated, service_role;

-- #region Storage
-- The slice of Supabase Storage the avatar policies are written against.
-- Column lists are trimmed to what those policies and the tests touch; this is
-- not a faithful copy of the storage schema, only enough of it for
-- `20260805172434_avatar_storage_bucket_and_policies.sql` to apply and be
-- exercised. Keep it in step with the columns that migration writes.
create schema if not exists storage;
grant usage on schema storage to anon, authenticated, service_role;

create table if not exists storage.buckets (
  id text primary key,
  name text not null,
  public boolean default false,
  file_size_limit bigint,
  allowed_mime_types text[],
  created_at timestamptz default now()
);

create table if not exists storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets (id),
  name text,
  owner uuid,
  metadata jsonb,
  created_at timestamptz default now()
);

alter table storage.objects enable row level security;

-- Supabase's own definition: the path segments of an object name, minus the
-- filename. `(storage.foldername(name))[1]` is therefore the owning folder,
-- which every avatar policy compares against auth.uid().
create or replace function storage.foldername(name text)
returns text[]
language plpgsql
immutable
as $$
declare
  parts text[];
begin
  select string_to_array(name, '/') into parts;
  return parts[1:array_length(parts, 1) - 1];
end
$$;

grant execute on function storage.foldername(text) to anon, authenticated, service_role;
grant select on storage.buckets to anon, authenticated, service_role;
grant select, insert, update, delete on storage.objects to anon, authenticated, service_role;
-- #endregion Storage
