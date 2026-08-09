-- friendships reads were `to public`, which meant anon could crawl the whole
-- social graph via /profile/:username/friends (read the list, click through,
-- repeat). None of the use cases that motivated open reads — username search,
-- add-by-username, friend counts, read-only friends pages — actually need
-- *anonymous* access, only signed-in access. Narrow to `authenticated`;
-- any signed-in user can still view anyone's friends list read-only, which is
-- unchanged and intentional.
drop policy "Friendships are publicly viewable" on public.friendships;
create policy "Friendships are viewable by signed-in users"
  on public.friendships for select to authenticated using (true);
