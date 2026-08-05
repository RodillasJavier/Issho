-- Carry the flagship member's artwork on the view, so a consumer that only
-- needs to *depict* a franchise (the profile's series cards) doesn't have to
-- fetch every member anime just to find a cover. Picked with the same
-- ordering as display_title, so the title and the art come from the same
-- show rather than the title from the TV entry and the art from an OVA.
--
-- Appended after the existing columns so CREATE OR REPLACE VIEW accepts it.

create or replace view public.franchises
with (security_invoker = true)
as
select
  a.franchise_key                                  as anilist_root_id,
  max(a.franchise_title)                           as title,
  (array_agg(
     a.name order by (coalesce(a.format, '') = 'TV') desc,
                     a.year nulls last,
                     length(a.name),
                     a.name
   ))[1]                                           as display_title,
  count(*)::int                                    as member_count,
  min(a.year)                                      as first_year,
  max(a.year)                                      as last_year,
  -- Same ordering as display_title, but skipping members with no artwork so
  -- a coverless flagship doesn't leave the whole franchise blank.
  (array_agg(
     a.cover_image_url order by (a.cover_image_url is not null) desc,
                                (coalesce(a.format, '') = 'TV') desc,
                                a.year nulls last,
                                length(a.name),
                                a.name
   ))[1]                                           as cover_image_url,
  (array_agg(
     a.banner_image_url order by (a.banner_image_url is not null) desc,
                                 (coalesce(a.format, '') = 'TV') desc,
                                 a.year nulls last,
                                 length(a.name),
                                 a.name
   ))[1]                                           as banner_image_url
from public.anime a
where a.franchise_key is not null
group by a.franchise_key;

grant select on public.franchises to anon, authenticated;
