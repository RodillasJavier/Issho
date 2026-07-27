-- The logged-out feed. These deliberately omit user_id and never join
-- profiles, so author identity does not leave the database at all -- the
-- anonymity is a property of the data rather than of the UI that draws it.
-- SECURITY DEFINER because anon has no SELECT grant on entries any more.

create or replace function public.get_public_feed(limit_count int default 60)
returns table (
  id uuid,
  anime_id uuid,
  entry_type text,
  content text,
  created_at timestamptz,
  rating_value int,
  status_value text,
  franchise_key bigint,
  likes_count bigint,
  dislikes_count bigint,
  comment_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    e.id,
    e.anime_id,
    e.entry_type::text,
    e.content,
    e.created_at,
    e.rating_value,
    e.status_value::text,
    e.franchise_key,
    coalesce(v.likes_count, 0) as likes_count,
    coalesce(v.dislikes_count, 0) as dislikes_count,
    coalesce(c.comment_count, 0) as comment_count
  from entries e
  left join lateral (
    select
      sum(case when vt.vote = 1 then 1 else 0 end) as likes_count,
      sum(case when vt.vote = -1 then 1 else 0 end) as dislikes_count
    from votes vt
    where vt.entry_id = e.id
  ) v on true
  left join lateral (
    select count(*) as comment_count
    from comments cm
    where cm.entry_id = e.id
  ) c on true
  order by e.created_at desc
  limit least(greatest(limit_count, 1), 200);
$$;

create or replace function public.get_public_entry(e_id uuid)
returns table (
  id uuid,
  anime_id uuid,
  entry_type text,
  content text,
  created_at timestamptz,
  rating_value int,
  status_value text,
  franchise_key bigint,
  likes_count bigint,
  dislikes_count bigint,
  comment_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    e.id,
    e.anime_id,
    e.entry_type::text,
    e.content,
    e.created_at,
    e.rating_value,
    e.status_value::text,
    e.franchise_key,
    coalesce(v.likes_count, 0) as likes_count,
    coalesce(v.dislikes_count, 0) as dislikes_count,
    coalesce(c.comment_count, 0) as comment_count
  from entries e
  left join lateral (
    select
      sum(case when vt.vote = 1 then 1 else 0 end) as likes_count,
      sum(case when vt.vote = -1 then 1 else 0 end) as dislikes_count
    from votes vt
    where vt.entry_id = e.id
  ) v on true
  left join lateral (
    select count(*) as comment_count
    from comments cm
    where cm.entry_id = e.id
  ) c on true
  where e.id = e_id;
$$;

-- Signed-in users always go through RLS on `entries`; only anon uses these.
revoke execute on function public.get_public_feed(int) from public, authenticated;
revoke execute on function public.get_public_entry(uuid) from public, authenticated;
grant execute on function public.get_public_feed(int) to anon;
grant execute on function public.get_public_entry(uuid) to anon;
