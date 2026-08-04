-- The avatars bucket carried two INSERT policies. Postgres ORs permissive
-- policies together, so "Enable insert for authenticated users only" —
-- WITH CHECK (true), with no bucket or path predicate at all — made the
-- correctly-scoped "Users can upload their own avatar" policy beside it
-- meaningless: any authenticated user could write any object into any
-- bucket, including over someone else's avatar folder.
drop policy if exists "Enable insert for authenticated users only" on storage.objects;

-- The UPDATE policy had a USING clause but no WITH CHECK, so a user could
-- take an object they legitimately own and move it into another user's
-- folder. Pin both ends of the rename.
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

-- Client-side validation in AvatarField is advisory only; enforce the same
-- limits on the bucket itself. The mime list mirrors AVATAR_MIME_EXTENSIONS
-- in src/services/supabase/profiles.ts.
update storage.buckets
set
  file_size_limit = 5242880,
  allowed_mime_types = array[
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp',
    'image/avif'
  ]
where id = 'avatars';
