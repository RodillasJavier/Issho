-- Promote franchises to a queryable, joinable object.
--
-- A franchise has no table of its own: it exists only as a shared
-- anime.franchise_key (the AniList id of the prequel-chain root, resolved by
-- src/services/anilistFranchise.ts). Everything the app wants to know about
-- one is derivable from its member anime, so this is a VIEW rather than a
-- table -- no backfill, no triggers, no second source of truth to drift.
--
-- Promote it to a real table on the day something needs *storing* per
-- franchise (a curated banner, a manual title override, a slug). The column
-- names here are chosen so that change stays contained to this file.

create or replace view public.franchises
-- Inherit the querying user's RLS on `anime` rather than running as the view
-- owner. `anime` is public metadata, so this changes nothing today; it means
-- the view can't silently become a privilege-escalation path if `anime` is
-- ever restricted.
with (security_invoker = true)
as
select
  a.franchise_key                                  as anilist_root_id,
  max(a.franchise_title)                           as title,
  -- The earliest TV member's name -- mirrors franchiseDisplayTitle() in
  -- src/utils/franchise.ts. The chain root is often an OVA or special
  -- ("Attack on Titan: No Regrets", "MONSTERS: 103 Mercies Dragon
  -- Damnation"), which makes a stable key but a poor headline. Falls back to
  -- the earliest member of any format when the franchise has no TV entry.
  -- NULLS LAST on the format test so a null-format row can't outrank a TV one.
  (array_agg(
     a.name order by (coalesce(a.format, '') = 'TV') desc,
                     a.year nulls last,
                     length(a.name),
                     a.name
   ))[1]                                           as display_title,
  count(*)::int                                    as member_count,
  min(a.year)                                      as first_year,
  max(a.year)                                      as last_year
from public.anime a
where a.franchise_key is not null
group by a.franchise_key;

comment on view public.franchises is
  'One row per franchise (AniList sequel/prequel chain), derived from '
  'anime.franchise_key. anilist_root_id is the AniList media id of the chain '
  'head and is the value used in /series/:franchiseKey URLs. display_title is '
  'the earliest TV member''s name -- what the UI should headline -- as opposed '
  'to title, which is the chain root''s own name and is often an OVA. '
  'DELIBERATELY NOT gated by can_view_user: this holds no user content, only '
  'public anime metadata, and logged-out visitors reach it through the '
  'de-identified public feed. Do not "harden" it -- that would break the '
  'logged-out experience. See the Visibility section of CLAUDE.md.';

-- Readable by exactly who can read `anime`: everyone, signed in or not.
grant select on public.franchises to anon, authenticated;
