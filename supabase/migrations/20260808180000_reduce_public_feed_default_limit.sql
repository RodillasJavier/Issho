-- Lower the anon feed's default page size from 60 to 30, matching the
-- signed-in feed's ENTRIES_PER_PAGE (src/components/EntryList.tsx) for
-- consistency. Same body/clamp as the baseline definition, only the default
-- changes.
create or replace function public.get_public_feed(limit_count integer default 30)
returns table (
  id uuid, anime_id uuid, entry_type text, content text, created_at timestamptz,
  rating_value integer, status_value text, franchise_key bigint,
  likes_count bigint, dislikes_count bigint, comment_count bigint
)
language sql
stable
security definer
set search_path to 'public'
as $$
  select
    e.id, e.anime_id, e.entry_type::text, e.content, e.created_at,
    e.rating_value, e.status_value::text, e.franchise_key,
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

revoke all on function public.get_public_feed(integer) from public, authenticated;
grant execute on function public.get_public_feed(integer) to anon;
