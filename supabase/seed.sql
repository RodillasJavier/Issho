-- supabase/seed.sql
--
-- Fixtures for the local stack: accounts the E2E suite can actually sign into,
-- plus enough anime and activity to exercise the feed, the friend gate and
-- series-level tracking.
--
-- Runs on every `supabase db reset`, so it must be deterministic — the tests
-- assert on these exact usernames and titles.
--
-- Also re-applied before every Playwright run by tests/e2e/seed.setup.ts, so it
-- must be safe to run against an already-seeded database. That is what the
-- reset region below is for: without it, a second run conflicts on the fixed
-- ids and the suite only ever passes once per `supabase db reset`.
--
-- Only ever loaded into a local database. The password below is a fixture, not
-- a credential.

-- #region Reset
-- Truncate before deleting the accounts: user_franchise_entries.user_id is the
-- one FK to profiles that is NO ACTION rather than CASCADE, so it would block
-- the delete instead of being swept along with it. Everything else falls out of
-- `delete from auth.users`, which cascades to profiles and on down.
truncate
  public.anime,
  public.entries,
  public.votes,
  public.comments,
  public.user_anime_entries,
  public.user_franchise_entries,
  public.friendships
  restart identity cascade;

delete from auth.users;
-- #endregion Reset

-- #region Accounts
-- GoTrue needs the bcrypt hash in auth.users and a matching row in
-- auth.identities before it will accept an email/password sign-in. The
-- handle_new_user trigger creates each profile; usernames are set afterwards.
do $$
declare
  seed_password text := 'TestPass1!';
  u record;
begin
  for u in
    select * from (values
      ('11111111-1111-1111-1111-111111111111'::uuid, 'alice@example.test', 'alice'),
      ('22222222-2222-2222-2222-222222222222'::uuid, 'bob@example.test',   'bob'),
      ('33333333-3333-3333-3333-333333333333'::uuid, 'carol@example.test', 'carol')
    ) as t(id, email, username)
  loop
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated',
      u.email, crypt(seed_password, gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}', '{}',
      '', '', '', ''
    );

    insert into auth.identities (
      provider_id, user_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) values (
      u.id::text, u.id,
      json_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true)::jsonb,
      'email', now(), now(), now()
    );

    update public.profiles
       set username = u.username,
           bio = u.username || ' is here for the anime.'
     where id = u.id;
  end loop;
end
$$;

-- Alice and Bob can see each other's activity. Carol is friends with nobody,
-- which is what makes her useful: she is the "not visible" case.
insert into public.friendships (requester_id, addressee_id, status)
values (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  'accepted'
);
-- #endregion Accounts

-- #region Catalogue
-- A two-season franchise (so the series-level UI appears) and a standalone
-- film (so the single-card path is covered too).
insert into public.anime (
  id, name, description, cover_image_url, year, format,
  anilist_id, franchise_key, franchise_title, episode_count, genres, status
) values
  ('aaaaaaaa-0000-0000-0000-000000000001',
   'Test Series Season One', 'The first season.', 'https://example.test/s1.jpg',
   2013, 'TV', 101, 101, 'Test Series', 25, 'Action, Drama', 'Finished Airing'),
  ('aaaaaaaa-0000-0000-0000-000000000002',
   'Test Series Season Two', 'The second season.', 'https://example.test/s2.jpg',
   2016, 'TV', 102, 101, 'Test Series', 12, 'Action, Drama', 'Finished Airing'),
  ('bbbbbbbb-0000-0000-0000-000000000001',
   'Standalone Film', 'A film that stands alone.', 'https://example.test/film.jpg',
   2020, 'MOVIE', 201, null, null, 1, 'Drama', 'Finished Airing');
-- #endregion Catalogue

-- #region Activity
-- One entry each from Bob (a friend, so Alice sees it) and Carol (a stranger,
-- so Alice must not) — the pair the visibility assertions hinge on.
insert into public.entries (id, anime_id, entry_type, user_id, content, rating_value)
values
  ('ccccccc1-0000-0000-0000-000000000001',
   'aaaaaaaa-0000-0000-0000-000000000001', 'review',
   '22222222-2222-2222-2222-222222222222',
   'Bob thinks season one holds up.', 8),
  ('ccccccc1-0000-0000-0000-000000000002',
   'bbbbbbbb-0000-0000-0000-000000000001', 'review',
   '33333333-3333-3333-3333-333333333333',
   'Carol on the standalone film. Alice must never see this.', 6);

insert into public.user_anime_entries (user_id, anime_id, status, rating)
values (
  '22222222-2222-2222-2222-222222222222',
  'aaaaaaaa-0000-0000-0000-000000000001',
  'completed', 8
);
-- #endregion Activity
