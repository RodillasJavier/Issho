-- Supabase's default privileges on the `public` schema grant anon and
-- authenticated ALL on newly created objects, so the `grant select` in
-- 20260728034143 added nothing -- the view also arrived with INSERT/UPDATE/
-- DELETE. The aggregate (GROUP BY) makes it non-auto-updatable, so writes
-- fail at runtime today; that is a Postgres implementation detail, not a
-- permission, and it would quietly stop protecting anything if the view were
-- ever simplified into an auto-updatable one. Writes would then propagate
-- into `anime`, which every authenticated user can already UPDATE.
--
-- Make the privilege say what we mean: this is a derived, read-only object.

revoke all on public.franchises from anon, authenticated;
grant select on public.franchises to anon, authenticated;
