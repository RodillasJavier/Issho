-- Corrects step 4 of constrain_friendship_writes, which was a no-op ----------
-- That migration ran `revoke update (requester_id, addressee_id, ...)`, but
-- `anon` and `authenticated` hold a TABLE-level UPDATE grant on friendships,
-- and a table-level grant implicitly covers every column. Column-level revokes
-- cannot subtract from it, so the repoint attack was still reaching the
-- guard trigger rather than being rejected at the privilege layer.
--
-- The fix is to drop to column-level grants: revoke the table-wide privilege,
-- then hand back UPDATE on `status` alone. `updated_at` does not need a grant
-- -- it is written by the friendships_updated_at_trigger, which runs with the
-- trigger function's rights, not the caller's.
--
-- INSERT is deliberately left table-wide: the INSERT policy already pins
-- requester_id to auth.uid() and status to 'pending', and addressee_id must
-- stay writable for a request to name its recipient.

revoke update on public.friendships from anon, authenticated;

-- anon gets nothing back: auth.uid() is null, so it can never satisfy the
-- update policy anyway.
grant update (status) on public.friendships to authenticated;
