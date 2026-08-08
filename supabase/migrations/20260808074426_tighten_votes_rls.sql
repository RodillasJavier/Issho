-- votes had the same two RLS gaps just fixed on the sibling comment_votes
-- table (comment_votes copied this shape verbatim, which is how the flaw
-- was caught):
--
-- 1. UPDATE's USING clause was `auth.uid() is not null` — any authenticated
--    user, not just the row's owner — so anyone who could read a peer's
--    vote row (SELECT is visibility-gated via can_view_entry, so any
--    mutual friend could) could retarget it by primary key id and
--    overwrite it with their own vote. WITH CHECK only validated the
--    *new* row, not which existing row could be targeted.
-- 2. INSERT never checked that the voter can actually see the entry being
--    voted on, so a vote row could be attached to content invisible to
--    its own author (defense-in-depth gap, not independently readable).

drop policy "Enable insert for users based on user_id" on public.votes;
create policy "Enable insert for users based on user_id"
  on public.votes for insert to authenticated
  with check ((select auth.uid()) = user_id and can_view_entry(entry_id));

drop policy "Enable update for users based on user_id" on public.votes;
create policy "Enable update for users based on user_id"
  on public.votes for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id and can_view_entry(entry_id));
