-- Constrain the friendships write path -------------------------------------
-- friend_gated_visibility_helpers_and_policies promoted `friendships` from a
-- UI-affordance table into the sole authorization boundary for all user
-- content (via can_view_user). Its write policies were never written with that
-- job in mind: the INSERT policy constrained only `requester_id`, leaving
-- `status` free, so any signed-up user could POST a row with
-- status='accepted' naming an arbitrary victim as addressee and immediately
-- read that victim's entries, lists, comments and votes. This closes that.

-- 1. Use the enum that already exists rather than free text, so no value
--    outside the three labels can ever be stored. (Not a control on its own --
--    'accepted' is a valid label -- but it removes the garbage-value surface
--    and makes the column match FriendshipStatus in database.types.ts.)
alter table public.friendships alter column status drop default;
alter table public.friendships
  alter column status type public.friendship_status
  using status::public.friendship_status;
alter table public.friendships
  alter column status set default 'pending'::public.friendship_status;

-- 2. A new friendship may only ever be created in the `pending` state, and
--    only by the requester. Consent now has to come from the addressee.
drop policy if exists "Users can send friend requests" on public.friendships;
create policy "Requests can only be sent as pending, by the requester"
  on public.friendships for insert to authenticated
  with check (
    auth.uid() = requester_id
    and status = 'pending'::public.friendship_status
  );

-- 3. Only the addressee of a still-pending request may act on it, and the only
--    thing they may set it to is `accepted`. (Rejecting/cancelling/unfriending
--    all DELETE the row -- see rejectFriendRequest/cancelFriendRequest/unfriend
--    in src/services/supabase/friendships.ts -- so no other transition needs to
--    be reachable.) USING pins the OLD row to pending; WITH CHECK pins the NEW
--    row's status and addressee.
drop policy if exists "Addressee can update friendship status" on public.friendships;
create policy "Addressee can accept a pending request"
  on public.friendships for update to authenticated
  using (
    auth.uid() = addressee_id
    and status = 'pending'::public.friendship_status
  )
  with check (
    auth.uid() = addressee_id
    and status = 'accepted'::public.friendship_status
  );

-- 4. A policy's WITH CHECK sees only the NEW row, so it cannot express
--    "requester_id did not change". Revoke the column privilege instead: no
--    client path ever updates these (only `status` is ever written after
--    insert), so this costs nothing and removes the repoint attack outright.
--
--    NOTE: this statement is a NO-OP as written -- see the following migration,
--    restrict_friendship_update_to_status_column, which corrects it. A
--    table-level UPDATE grant implicitly covers every column, and a
--    column-level revoke cannot subtract from it. Kept here so the applied
--    history stays faithful; the next migration is what actually enforces it.
revoke update (id, requester_id, addressee_id, created_at)
  on public.friendships from anon, authenticated;

-- 5. Defense in depth for any path that bypasses the column grants: the
--    identities of a friendship are immutable once created.
create or replace function public.friendships_identities_are_immutable()
returns trigger
language plpgsql
set search_path = public
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

drop trigger if exists friendships_identities_immutable_trigger on public.friendships;
create trigger friendships_identities_immutable_trigger
  before update on public.friendships
  for each row execute function public.friendships_identities_are_immutable();
