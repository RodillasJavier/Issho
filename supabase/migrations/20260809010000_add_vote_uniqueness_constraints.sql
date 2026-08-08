-- votes/comment_votes relied entirely on application logic (the
-- select-then-branch toggle in castTableVote) to keep one vote row per
-- user per target. Two near-simultaneous requests (a double-click before
-- the button disables, a retry, two open tabs) can both see "no existing
-- vote" and both insert, producing two rows for the same user + target:
-- aggregate counts double-count and the next vote attempt's .maybeSingle()
-- then throws (finds 2 rows) instead of toggling. These constraints make
-- the invariant a database guarantee instead of a client-side assumption.
-- castTableVote now catches the resulting unique-violation (23505) on
-- insert and retries as an update instead of surfacing an error.
alter table public.votes
  add constraint votes_entry_user_unique unique (entry_id, user_id);
alter table public.comment_votes
  add constraint comment_votes_comment_user_unique unique (comment_id, user_id);
