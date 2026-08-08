-- comments' INSERT policy had no ownership or visibility check at all
-- (`with check (true)`), unlike every other user-content table in this
-- schema. Any authenticated user could:
--   1. attach a comment to an entry_id they cannot see — the same
--      defense-in-depth gap already closed on votes/comment_votes (comments
--      SELECT is itself visibility-gated via can_view_entry, so this only
--      let someone write into a thread blind, not read it), and
--   2. insert a comment with an arbitrary user_id, forging a comment
--      attributed to someone else — the table grants column-level ALL to
--      authenticated and nothing constrained user_id to auth.uid().
drop policy "Enable insert for authenticated users only" on public.comments;
create policy "Enable insert for authenticated users only"
  on public.comments for insert to authenticated
  with check ((select auth.uid()) = user_id and can_view_entry(entry_id));
