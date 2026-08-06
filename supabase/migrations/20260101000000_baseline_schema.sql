-- Baseline schema.
--
-- Issho's tables were originally created through the Supabase dashboard, so
-- the migration history in the remote project starts partway through the story
-- and no `create table` statement existed anywhere in this repo. A fresh
-- database could not be built from source, which meant the RLS policies — the
-- entire privacy boundary — had nothing to run against and nothing could test
-- them.
--
-- This file is that missing starting point: the live schema as of 2026-08-04,
-- reconstructed from the project's catalog. It supersedes the migrations that
-- ran before it; those are preserved verbatim in `archive/` for the reasoning
-- in their comments, which is worth keeping even though they no longer replay.
--
-- Everything from here on is an ordinary incremental migration.

-- #region Enums
-- "Entry Types" is quoted because that is genuinely its name, spaces, capitals
-- and all — an early dashboard-era choice. Renaming it would be a breaking
-- change for no benefit, so it is reproduced faithfully.
create type "Entry Types" as enum ('review', 'rating', 'status_update');
create type user_anime_status as enum ('not_started', 'watching', 'completed', 'dropped');
create type friendship_status as enum ('pending', 'accepted', 'rejected');
-- #endregion Enums

-- #region Tables
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint username_length check (char_length(username) >= 3 and char_length(username) <= 20),
  constraint username_format check (username ~ '^[a-zA-Z0-9_]+$')
);

create table public.anime (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz default now(),
  name text not null,
  name_japanese text,
  description text not null,
  episode_count integer,
  cover_image_url text not null,
  banner_image_url text,
  year integer,
  genres text,
  status text,
  format text,
  -- Legacy MAL id, superseded by anilist_id as the external key.
  external_id integer unique,
  mal_id integer,
  mal_url text,
  anilist_id integer unique,
  anilist_url text,
  -- AniList id of the sequel/prequel chain root, plus its denormalized title.
  franchise_key integer,
  franchise_title text
);

create table public.entries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  content text,
  anime_id uuid not null references public.anime (id) on delete cascade,
  entry_type "Entry Types" not null,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  rating_value integer,
  status_value user_anime_status,
  -- Set when the entry is about a whole series rather than one season.
  franchise_key bigint,
  constraint entries_rating_value_check
    check (rating_value is null or (rating_value >= 1 and rating_value <= 10))
);

create table public.votes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  entry_id uuid not null references public.entries (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  vote integer not null
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  entry_id uuid not null references public.entries (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  parent_comment_id uuid references public.comments (id) on delete cascade,
  content text not null,
  is_spoiler boolean not null default false
);

create table public.user_anime_entries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  anime_id uuid not null references public.anime (id) on delete cascade,
  status user_anime_status not null default 'not_started',
  rating integer,
  review text,
  constraint user_anime_unique unique (user_id, anime_id),
  constraint rating_range check (rating is null or (rating >= 1 and rating <= 10))
);

-- Series-level tracking, keyed on anime.franchise_key. Deliberately independent
-- of the per-season rows: nothing reconciles the two levels automatically.
create table public.user_franchise_entries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id uuid not null default auth.uid() references public.profiles (id),
  franchise_key integer not null,
  status user_anime_status not null default 'not_started',
  rating integer,
  review text,
  unique (user_id, franchise_key),
  constraint user_franchise_entries_rating_check
    check (rating is null or (rating >= 1 and rating <= 10))
);

create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles (id) on delete cascade,
  addressee_id uuid not null references public.profiles (id) on delete cascade,
  status friendship_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint unique_friendship unique (requester_id, addressee_id),
  constraint no_self_friendship check (requester_id <> addressee_id)
);
-- #endregion Tables

-- #region Indexes
create index idx_anime_external_id on public.anime (external_id);
create index anime_mal_id_idx on public.anime (mal_id);
create index anime_franchise_key_idx on public.anime (franchise_key);

create index idx_user_anime_entries_user_id on public.user_anime_entries (user_id);
create index idx_user_anime_entries_status on public.user_anime_entries (user_id, status);

create index profiles_username_idx on public.profiles (username);

create index idx_friendships_requester on public.friendships (requester_id);
create index idx_friendships_addressee on public.friendships (addressee_id);
-- Both directions, because can_view_user checks the friendship either way round.
create index friendships_requester_addressee_status_idx
  on public.friendships (requester_id, addressee_id, status);
create index friendships_addressee_requester_status_idx
  on public.friendships (addressee_id, requester_id, status);
-- #endregion Indexes

-- #region Trigger functions
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.update_friendships_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Every auth user gets a profile row immediately, so the FKs pointing at
-- profiles are satisfiable from the moment the account exists.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, 'user_' || substr(new.id::text, 1, 8));
  return new;
end;
$$;

-- Defence in depth behind the column-level UPDATE grant below: even a path
-- that could write these columns cannot repoint a friendship at someone else.
create or replace function public.friendships_identities_are_immutable()
returns trigger
language plpgsql
set search_path to 'public'
as $$
begin
  if new.requester_id is distinct from old.requester_id
     or new.addressee_id is distinct from old.addressee_id then
    raise exception
      'friendship parties are immutable (attempted %/% -> %/%)',
      old.requester_id, old.addressee_id, new.requester_id, new.addressee_id
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;
-- #endregion Trigger functions

-- #region Triggers
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create trigger update_user_anime_entries_updated_at
  before update on public.user_anime_entries
  for each row execute function public.update_updated_at_column();

create trigger friendships_updated_at_trigger
  before update on public.friendships
  for each row execute function public.update_friendships_updated_at();

create trigger friendships_identities_immutable_trigger
  before update on public.friendships
  for each row execute function public.friendships_identities_are_immutable();
-- #endregion Triggers

-- #region Visibility helpers
-- The predicate behind every SELECT policy on user content. SECURITY DEFINER
-- so that policies querying `friendships` don't recurse through its own RLS.
create or replace function public.can_view_user(target uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select target = auth.uid()
     or exists (
       select 1
       from friendships f
       where f.status = 'accepted'
         and ((f.requester_id = auth.uid() and f.addressee_id = target)
           or (f.addressee_id = auth.uid() and f.requester_id = target))
     );
$$;

-- Comment and vote visibility keys off the parent entry's AUTHOR, not the
-- commenter — so a thread you can see renders in full rather than half-empty.
create or replace function public.can_view_entry(e_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select public.can_view_user(e.user_id) from entries e where e.id = e_id;
$$;

-- These evaluate as the querying role, so `authenticated` must hold execute.
-- anon must not: it has no SELECT grant on user content and no business
-- probing the friendship graph.
revoke all on function public.can_view_user(uuid) from public, anon;
revoke all on function public.can_view_entry(uuid) from public, anon;
grant execute on function public.can_view_user(uuid) to authenticated;
grant execute on function public.can_view_entry(uuid) to authenticated;
-- #endregion Visibility helpers

-- #region Feed RPCs
-- The signed-in feed. Deliberately NOT security definer: it inherits the
-- `entries` SELECT policy, which is why one policy covers the home feed,
-- /entry/:id, anime pages, series pages and the friends page at once. Making
-- it definer would silently reopen global visibility.
create or replace function public.get_entries_with_counts()
returns table (
  id uuid, anime_id uuid, user_id uuid, entry_type text, content text,
  created_at timestamptz, rating_value integer, status_value text,
  franchise_key bigint, likes_count bigint, dislikes_count bigint,
  comment_count bigint, user_vote integer
)
language sql
stable
as $$
  select
    e.id, e.anime_id, e.user_id, e.entry_type, e.content, e.created_at,
    e.rating_value, e.status_value, e.franchise_key,
    coalesce(v.likes_count, 0) as likes_count,
    coalesce(v.dislikes_count, 0) as dislikes_count,
    coalesce(c.comment_count, 0) as comment_count,
    v.user_vote
  from entries e
  left join lateral (
    select
      sum(case when vt.vote = 1 then 1 else 0 end) as likes_count,
      sum(case when vt.vote = -1 then 1 else 0 end) as dislikes_count,
      max(case when vt.user_id = auth.uid() then vt.vote end) as user_vote
    from votes vt
    where vt.entry_id = e.id
  ) v on true
  left join lateral (
    select count(*) as comment_count
    from comments cm
    where cm.entry_id = e.id
  ) c on true
  order by e.created_at desc;
$$;

-- The logged-out feed. The return type structurally OMITS user_id and never
-- joins profiles, so author identity never leaves the database — anonymity is
-- a property of the data, not a display flag the UI could forget to set.
create or replace function public.get_public_feed(limit_count integer default 60)
returns table (
  id uuid, anime_id uuid, entry_type text, content text, created_at timestamptz,
  rating_value integer, status_value text, franchise_key bigint,
  likes_count bigint, dislikes_count bigint, comment_count bigint
)
language sql
stable
security definer
set search_path to 'public'
as $$
  select
    e.id, e.anime_id, e.entry_type::text, e.content, e.created_at,
    e.rating_value, e.status_value::text, e.franchise_key,
    coalesce(v.likes_count, 0) as likes_count,
    coalesce(v.dislikes_count, 0) as dislikes_count,
    coalesce(c.comment_count, 0) as comment_count
  from entries e
  left join lateral (
    select
      sum(case when vt.vote = 1 then 1 else 0 end) as likes_count,
      sum(case when vt.vote = -1 then 1 else 0 end) as dislikes_count
    from votes vt
    where vt.entry_id = e.id
  ) v on true
  left join lateral (
    select count(*) as comment_count
    from comments cm
    where cm.entry_id = e.id
  ) c on true
  order by e.created_at desc
  limit least(greatest(limit_count, 1), 200);
$$;

create or replace function public.get_public_entry(e_id uuid)
returns table (
  id uuid, anime_id uuid, entry_type text, content text, created_at timestamptz,
  rating_value integer, status_value text, franchise_key bigint,
  likes_count bigint, dislikes_count bigint, comment_count bigint
)
language sql
stable
security definer
set search_path to 'public'
as $$
  select
    e.id, e.anime_id, e.entry_type::text, e.content, e.created_at,
    e.rating_value, e.status_value::text, e.franchise_key,
    coalesce(v.likes_count, 0) as likes_count,
    coalesce(v.dislikes_count, 0) as dislikes_count,
    coalesce(c.comment_count, 0) as comment_count
  from entries e
  left join lateral (
    select
      sum(case when vt.vote = 1 then 1 else 0 end) as likes_count,
      sum(case when vt.vote = -1 then 1 else 0 end) as dislikes_count
    from votes vt
    where vt.entry_id = e.id
  ) v on true
  left join lateral (
    select count(*) as comment_count
    from comments cm
    where cm.entry_id = e.id
  ) c on true
  where e.id = e_id;
$$;

-- anon only. A signed-in user must go through RLS on `entries` instead, or
-- they could read the whole site de-identified.
revoke all on function public.get_public_feed(integer) from public, authenticated;
revoke all on function public.get_public_entry(uuid) from public, authenticated;
grant execute on function public.get_public_feed(integer) to anon;
grant execute on function public.get_public_entry(uuid) to anon;
-- #endregion Feed RPCs

-- #region Franchises view
-- One row per sequel/prequel chain, derived entirely from anime.franchise_key.
-- `display_title` is the earliest TV member's name (what the UI headlines),
-- while `title` is the chain root's own name — often an OVA, a stable key but
-- a poor headline.
--
-- security_invoker so it inherits `anime`'s RLS rather than running as its
-- owner. This holds no user content, only public anime metadata, and
-- logged-out visitors reach it alongside the de-identified feed — so it is a
-- deliberate exception to friend-gating, not an oversight.
create view public.franchises
with (security_invoker = true)
as
  select
    franchise_key as anilist_root_id,
    max(franchise_title) as title,
    (array_agg(name order by (coalesce(format, '') = 'TV') desc, year, length(name), name))[1] as display_title,
    count(*)::integer as member_count,
    min(year) as first_year,
    max(year) as last_year,
    (array_agg(cover_image_url order by (cover_image_url is not null) desc, (coalesce(format, '') = 'TV') desc, year, length(name), name))[1] as cover_image_url,
    (array_agg(banner_image_url order by (banner_image_url is not null) desc, (coalesce(format, '') = 'TV') desc, year, length(name), name))[1] as banner_image_url
  from anime a
  where franchise_key is not null
  group by franchise_key;

-- Supabase default-grants ALL on new objects in `public`, so a bare
-- `grant select` would restrict nothing — the revoke is what does the work.
revoke all on public.franchises from anon, authenticated;
grant select on public.franchises to anon, authenticated;
-- #endregion Franchises view

-- #region Table grants
-- Stated explicitly rather than inherited from Supabase's default privileges
-- on `public`. The defaults do grant ALL on new objects, which is how the
-- production database ended up with these — but relying on that is what made
-- two separate migrations necessary to claw privileges back (the franchises
-- view, the friendships status column), and it leaves nothing in git saying
-- what a role may actually do. RLS still decides which *rows* are reachable;
-- these are the table-level privileges RLS is evaluated on top of.
grant all on table
  public.profiles,
  public.anime,
  public.entries,
  public.votes,
  public.comments,
  public.user_anime_entries,
  public.user_franchise_entries
to anon, authenticated;

-- friendships is granted the same set below, then has UPDATE taken back — see
-- the note at the end of this file for why it cannot simply be omitted here.
grant all on table public.friendships to anon, authenticated;

grant usage on all sequences in schema public to anon, authenticated;
-- #endregion Table grants

-- #region Row level security
alter table public.profiles enable row level security;
alter table public.anime enable row level security;
alter table public.entries enable row level security;
alter table public.votes enable row level security;
alter table public.comments enable row level security;
alter table public.user_anime_entries enable row level security;
alter table public.user_franchise_entries enable row level security;
alter table public.friendships enable row level security;

-- Profiles and friendships stay world-readable on purpose: username search,
-- add-by-username, friend counts and read-only friends pages all depend on it.
create policy "Profiles are viewable by everyone"
  on public.profiles for select to public using (true);
create policy "Users can insert their own profile"
  on public.profiles for insert to public with check (auth.uid() = id);
create policy "Users can update their own profile"
  on public.profiles for update to public using (auth.uid() = id);

-- Anime is a shared public catalogue.
create policy "Enable read access for all users"
  on public.anime for select to public using (true);
create policy "Enable insert for authenticated users only"
  on public.anime for insert to authenticated with check (true);
create policy "Enable update for authenticated users"
  on public.anime for update to authenticated using (true) with check (true);

-- The friend gate. You see your own activity and your accepted friends', and
-- nothing else. The UI's filter tabs split an already-scoped set into views;
-- they are NOT the privacy boundary.
create policy "Entries are visible to the author and their friends"
  on public.entries for select to authenticated using (can_view_user(user_id));
create policy "Enable insert for authenticated users only"
  on public.entries for insert to authenticated with check (true);
create policy "Enable delete for users based on user_id"
  on public.entries for delete to authenticated using (auth.uid() = user_id);

create policy "Anime lists are visible to the owner and their friends"
  on public.user_anime_entries for select to authenticated using (can_view_user(user_id));
create policy "Enable insert for users based on user_id"
  on public.user_anime_entries for insert to public with check ((select auth.uid()) = user_id);
create policy "Enable update for users based on user_id"
  on public.user_anime_entries for update to public
  using (auth.uid() is not null) with check ((select auth.uid()) = user_id);
create policy "Enable delete for users based on user_id"
  on public.user_anime_entries for delete to public using (auth.uid() = user_id);

create policy "Franchise lists are visible to the owner and their friends"
  on public.user_franchise_entries for select to authenticated using (can_view_user(user_id));
create policy "Enable insert for users based on user_id"
  on public.user_franchise_entries for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Enable update for users based on user_id"
  on public.user_franchise_entries for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Enable delete for users based on user_id"
  on public.user_franchise_entries for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Votes are visible when the parent entry is"
  on public.votes for select to authenticated using (can_view_entry(entry_id));
create policy "Enable insert for users based on user_id"
  on public.votes for insert to public with check ((select auth.uid()) = user_id);
create policy "Enable update for users based on user_id"
  on public.votes for update to public
  using (auth.uid() is not null) with check ((select auth.uid()) = user_id);
create policy "Enable delete for users based on user_id"
  on public.votes for delete to public using ((select auth.uid()) = user_id);

create policy "Comments are visible when the parent entry is"
  on public.comments for select to authenticated using (can_view_entry(entry_id));
create policy "Enable insert for authenticated users only"
  on public.comments for insert to authenticated with check (true);
create policy "Enable delete for users based on user_id"
  on public.comments for delete to public using ((select auth.uid()) = user_id);

-- Friendship WRITES are the authorization boundary: anyone who could write
-- status = 'accepted' would grant themselves the victim's entire feed.
--   * a row can only be born pending, and only by its requester
--   * only the addressee may flip it, and only pending -> accepted
--   * `using (status = 'pending')` is also what makes accepting twice a no-op
--     rather than an error — the second update matches zero rows
-- Rejecting, cancelling and unfriending all DELETE, so 'rejected' is never
-- written. Don't add a transition without revisiting the UPDATE policy.
create policy "Friendships are publicly viewable"
  on public.friendships for select to public using (true);
create policy "Requests can only be sent as pending, by the requester"
  on public.friendships for insert to authenticated
  with check (auth.uid() = requester_id and status = 'pending');
create policy "Addressee can accept a pending request"
  on public.friendships for update to authenticated
  using (auth.uid() = addressee_id and status = 'pending')
  with check (auth.uid() = addressee_id and status = 'accepted');
create policy "Either party can delete friendship"
  on public.friendships for delete to public
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- A table-wide UPDATE grant would silently reopen the repoint attack, because
-- a column-level revoke cannot subtract from it. Revoke the table, then grant
-- exactly the one column that may change.
revoke update on public.friendships from anon, authenticated;
grant update (status) on public.friendships to authenticated;
-- #endregion Row level security
