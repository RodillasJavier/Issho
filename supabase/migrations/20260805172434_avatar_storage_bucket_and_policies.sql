-- The avatars bucket and its object policies.
--
-- These were missing from the reproducible schema entirely. The bucket was
-- created through the dashboard, so it lives in none of this repo's migrations,
-- and 20260101000000_baseline_schema.sql covers only the `public` schema. The
-- one migration that did touch storage — archive/20260802185750 — assumed the
-- bucket already existed (`update storage.buckets ... where id = 'avatars'`)
-- and is archived, so it never runs again.
--
-- The result was that a database built from source got no avatars bucket and no
-- storage RLS at all: avatar upload was the one feature that could not work on a
-- fresh local stack, and the hardening below existed only in production.
--
-- Reproduced from the live project's catalog, so applying this to production is
-- a no-op. Policies are `to public` there rather than `to authenticated`; the
-- auth.uid() comparison is what actually scopes them, and an anonymous caller
-- has no uid to match. Kept as-is so the two stay identical.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/avif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Avatars are shown next to entries and on profiles, both of which are reachable
-- logged-out, so reads are open. The bucket holds no private objects.
drop policy if exists "Avatar images are publicly accessible" on storage.objects;
create policy "Avatar images are publicly accessible"
on storage.objects
for select
using (bucket_id = 'avatars');

-- Writes are scoped to a folder named for the uploader's uid — see uploadAvatar
-- in src/services/supabase/profiles.ts for the path pattern.
--
-- The dashboard's default "Enable insert for authenticated users only" policy
-- (WITH CHECK (true), no bucket or path predicate) is dropped rather than
-- ignored: permissive policies are ORed, so leaving it in place would let any
-- authenticated user write any object into any bucket, and the scoped policy
-- beside it would mean nothing.
drop policy if exists "Enable insert for authenticated users only" on storage.objects;

drop policy if exists "Users can upload their own avatar" on storage.objects;
create policy "Users can upload their own avatar"
on storage.objects
for insert
with check (
  bucket_id = 'avatars'
  and (auth.uid())::text = (storage.foldername(name))[1]
);

-- Both ends pinned. The explicit WITH CHECK is belt-and-braces rather than the
-- fix it looks like: for an UPDATE policy Postgres already defaults WITH CHECK
-- to the USING expression, so dropping it changes nothing today (verified by
-- mutation — the rename test stays green). It is spelled out so that a future
-- edit loosening USING for visibility cannot silently loosen what may be
-- written, which is the failure the archived 20260802185750 was guarding.
drop policy if exists "Users can update their own avatar" on storage.objects;
create policy "Users can update their own avatar"
on storage.objects
for update
using (
  bucket_id = 'avatars'
  and (auth.uid())::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'avatars'
  and (auth.uid())::text = (storage.foldername(name))[1]
);

drop policy if exists "Users can delete their own avatar" on storage.objects;
create policy "Users can delete their own avatar"
on storage.objects
for delete
using (
  bucket_id = 'avatars'
  and (auth.uid())::text = (storage.foldername(name))[1]
);
