-- Reddit-style up/down voting on individual comments, mirroring the `votes`
-- table's shape (including its lack of a unique(comment_id, user_id)
-- constraint — castCommentVote does the same select-then-branch toggle
-- dance as castVote, so staying pattern-consistent beats adding a
-- constraint the sibling table doesn't have).
create table public.comment_votes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  comment_id uuid not null references public.comments (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  vote integer not null
);

-- One hop from can_view_entry, same layering as can_view_entry wraps
-- can_view_user: comment vote visibility keys off the parent entry's
-- author via the comment's entry_id, not the voter.
create or replace function public.can_view_comment(c_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select public.can_view_entry(entry_id) from comments where id = c_id;
$$;

revoke all on function public.can_view_comment(uuid) from public, anon;
grant execute on function public.can_view_comment(uuid) to authenticated;

grant all on table public.comment_votes to anon, authenticated;

alter table public.comment_votes enable row level security;

create policy "Comment votes are visible when the parent entry is"
  on public.comment_votes for select to authenticated using (can_view_comment(comment_id));
create policy "Enable insert for users based on user_id"
  on public.comment_votes for insert to authenticated
  with check ((select auth.uid()) = user_id and can_view_comment(comment_id));
create policy "Enable update for users based on user_id"
  on public.comment_votes for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id and can_view_comment(comment_id));
create policy "Enable delete for users based on user_id"
  on public.comment_votes for delete to public using ((select auth.uid()) = user_id);

-- Flat list, deliberately no ORDER BY — sorting happens client-side
-- (sortComments) against the tree the client builds from this flat list, so
-- a SQL-level order would just be discarded. Not SECURITY DEFINER, mirroring
-- get_entries_with_counts: it inherits comments' SELECT policy, so calling
-- it as anon returns nothing without needing an explicit revoke.
create or replace function public.get_comments_with_counts(p_entry_id uuid)
returns table (
  id uuid, created_at timestamptz, entry_id uuid, user_id uuid,
  parent_comment_id uuid, content text, is_spoiler boolean,
  likes_count bigint, dislikes_count bigint, user_vote integer
)
language sql
stable
as $$
  select
    c.id, c.created_at, c.entry_id, c.user_id, c.parent_comment_id,
    c.content, c.is_spoiler,
    coalesce(v.likes_count, 0) as likes_count,
    coalesce(v.dislikes_count, 0) as dislikes_count,
    v.user_vote
  from comments c
  left join lateral (
    select
      sum(case when cv.vote = 1 then 1 else 0 end) as likes_count,
      sum(case when cv.vote = -1 then 1 else 0 end) as dislikes_count,
      max(case when cv.user_id = auth.uid() then cv.vote end) as user_vote
    from comment_votes cv
    where cv.comment_id = c.id
  ) v on true
  where c.entry_id = p_entry_id;
$$;
