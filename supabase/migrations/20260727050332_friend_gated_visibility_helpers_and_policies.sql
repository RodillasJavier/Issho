-- Visibility helpers -------------------------------------------------------
-- SECURITY DEFINER so policies never re-enter RLS (no recursion, and the
-- friendship lookup is evaluated once per row without policy overhead).

create or replace function public.can_view_user(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
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

create or replace function public.can_view_entry(e_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.can_view_user(e.user_id) from entries e where e.id = e_id;
$$;

revoke execute on function public.can_view_user(uuid) from public;
revoke execute on function public.can_view_entry(uuid) from public;
grant execute on function public.can_view_user(uuid) to authenticated;
grant execute on function public.can_view_entry(uuid) to authenticated;

-- Supporting indexes for the friendship lookup, in both directions.
create index if not exists friendships_requester_addressee_status_idx
  on public.friendships (requester_id, addressee_id, status);
create index if not exists friendships_addressee_requester_status_idx
  on public.friendships (addressee_id, requester_id, status);

-- Friend-gated SELECT policies ---------------------------------------------
-- Every one of these was previously `USING (true)` for role `public`, which
-- made the whole database readable with the anon key.

drop policy if exists "Enable read access for all users" on public.entries;
create policy "Entries are visible to the author and their friends"
  on public.entries for select to authenticated
  using (public.can_view_user(user_id));

drop policy if exists "User anime lists are publicly viewable" on public.user_anime_entries;
drop policy if exists "Enable users to view their own data only" on public.user_anime_entries;
create policy "Anime lists are visible to the owner and their friends"
  on public.user_anime_entries for select to authenticated
  using (public.can_view_user(user_id));

drop policy if exists "User franchise lists are publicly viewable" on public.user_franchise_entries;
create policy "Franchise lists are visible to the owner and their friends"
  on public.user_franchise_entries for select to authenticated
  using (public.can_view_user(user_id));

-- Comments and votes key off the PARENT ENTRY rather than their own author,
-- so a visible thread renders in full rather than half-empty.
drop policy if exists "Enable read access for all users" on public.comments;
create policy "Comments are visible when the parent entry is"
  on public.comments for select to authenticated
  using (public.can_view_entry(entry_id));

drop policy if exists "Enable read access for all users" on public.votes;
create policy "Votes are visible when the parent entry is"
  on public.votes for select to authenticated
  using (public.can_view_entry(entry_id));

-- Supabase's default privileges grant EXECUTE on new public functions to
-- anon and authenticated, which re-adds anon behind the `revoke ... from
-- public` above. These are internal RLS policy helpers and must not be
-- reachable over /rest/v1/rpc by unauthenticated callers. `authenticated`
-- keeps EXECUTE: the policies that call them are evaluated as the querying
-- role, so it's required for RLS to work at all.
revoke execute on function public.can_view_user(uuid) from anon;
revoke execute on function public.can_view_entry(uuid) from anon;
