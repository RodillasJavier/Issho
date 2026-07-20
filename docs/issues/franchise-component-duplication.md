# Unify per-anime / per-franchise UI component pairs

**Status:** open
**Type:** tech debt / refactor
**Origin:** flagged by `/simplify` (reuse + altitude review) during the AniList/franchise-grouping migration, skipped as out-of-scope for a cleanup pass

## Summary

The franchise-grouping feature added a series-level ("whole franchise") twin
for three existing per-anime components, by copy-pasting the original and
swapping the data source. All three pairs are near-total duplicates — same
markup, same class strings, same state machine — differing only in which
service functions they call and a handful of labels. Each pair now needs
every future UI/behavior change applied twice.

| Per-anime (existing) | Per-franchise (new) | Size |
|---|---|---|
| `src/components/EditListEntryModal.tsx` | `src/components/EditFranchiseEntryModal.tsx` | 199 / 247 lines |
| `src/components/AddToListButton.tsx` | `src/components/FranchiseListButton.tsx` | 153 / 151 lines |
| `src/components/MyAnimeListItem.tsx` | `src/components/MyFranchiseListItem.tsx` | 149 / 202 lines |

None of these were unified during the migration because a mechanical merge
carries real behavior-change risk across a lot of JSX, and this repo has no
test suite to catch a regression (`CLAUDE.md`: "There is no test suite
configured in this repo"). This doc specs out the unification so it can be
done deliberately, with manual QA, rather than folded into an unrelated diff.

## Pair 1 — Edit entry modal

`EditListEntryModal` (`entry: UserAnimeEntry`) and `EditFranchiseEntryModal`
(`entry: UserFranchiseEntry`) share an identical modal shell: header, status
`<select>`, rating `<input type=number>`, notes `<textarea>`, delete/cancel/save
action row, and error messages below the form. Concretely they differ in:

- **Data source & mutations** — `updateUserAnimeEntry`/`removeUserAnimeEntry`
  (`services/supabase/userAnimeList.ts`) vs.
  `updateUserFranchiseEntry`/`removeUserFranchiseEntry`
  (`services/supabase/userFranchiseList.ts`).
- **Query invalidation keys** — `["userAnimeList", ...]` vs.
  `["userFranchiseList", ...]`.
- **Copy** — "Edit List Entry" / "Status" / "Rating (1-10)" / "Personal Notes"
  vs. "Edit Series Entry" / "Series Status" / "Series Rating (1-10)" / "Series
  Notes"; confirm dialog text ("Remove this anime..." vs. "Remove this
  series...").
- **Franchise-only extra step** — after marking a franchise `completed` for
  the first time, `EditFranchiseEntryModal` swaps to a second screen offering
  to mark all seasons completed too (`markFranchiseSeasonsCompleted`), a
  behavior with no per-anime equivalent.

### Proposed shape

A single `EntryEditModal` parametrized by a small config object, e.g.:

```ts
interface EntryEditModalProps<TEntry extends { id: string; status: AnimeStatus; rating: number | null; review: string | null }> {
  entry: TEntry;
  title: string;            // "Edit List Entry" | "Edit Series Entry"
  subtitle?: string;         // anime name | franchise title
  statusLabel: string;       // "Status" | "Series Status"
  ratingLabel: string;
  notesLabel: string;
  removeConfirmText: string;
  onUpdate: (updates: Pick<TEntry, "status" | "rating" | "review">) => Promise<unknown>;
  onRemove: () => Promise<unknown>;
  onInvalidate: () => void;  // query-key invalidation, caller-owned
  onClose: () => void;
  /** Franchise-only: rendered instead of the form when non-null */
  postSaveStep?: (ctx: { justCompleted: boolean }) => React.ReactNode;
}
```

The "mark seasons completed" second screen stays specific to the franchise
call site — pass it in via `postSaveStep` (or keep
`EditFranchiseEntryModal` as a thin wrapper around the shared
`EntryEditModal` that supplies this one extra screen) rather than baking a
franchise special-case into the shared component.

## Pair 2 — Add/track list button

`AddToListButton` (`animeId`) and `FranchiseListButton` (`franchiseKey`) share
an identical state machine: fetch current entry, toggle a status-picker
dropdown, branch add-vs-update mutation on whether an entry exists, invalidate
queries, click-outside-to-close overlay. They differ in:

- Query key root (`userAnimeList` vs `userFranchiseList`) and the id param
  (`animeId` vs `franchiseKey`).
- Service functions: `getUserAnimeEntry`/`addUserAnimeEntry`/`updateUserAnimeEntry`
  vs. `getUserFranchiseEntry`/`addUserFranchiseEntry`/`updateUserFranchiseEntry`.
- Button copy/style when no entry exists — "+ Add to your List" (solid rose)
  vs. "+ Track Whole Series" (outlined); status label prefix "Series: " on
  the franchise button.

### Proposed shape

Extract the state machine into a hook, keep two thin presentational wrappers
for the copy/style differences (which are legitimately different — a franchise
button shouldn't look identical to the per-anime one, that's a real UX signal
of "this is series-level"):

```ts
function useListStatusEntry(params: {
  queryKey: unknown[];           // ["userAnimeList", animeId, userId] | ["userFranchiseList", franchiseKey, userId]
  getEntry: () => Promise<{ id: string; status: AnimeStatus } | null>;
  addEntry: (status: AnimeStatus) => Promise<unknown>;
  updateEntry: (entryId: string, status: AnimeStatus) => Promise<unknown>;
  invalidateKeys: unknown[][];
}): {
  entry, isLoading, error,
  showStatusPicker, setShowStatusPicker,
  handleStatusSelect, isMutating,
}
```

`AddToListButton` and `FranchiseListButton` become ~40-line components that
call the hook and render their own copy/labels/dropdown styling.

## Pair 3 — Profile list card

`MyAnimeListItem` (`entry: UserAnimeEntry`) and `MyFranchiseListItem`
(`franchiseKey`, `title`, `entries`, `franchiseEntry`, `isOwnProfile`) share
the same card shell: hover-gradient wrapper, cover image, title link, status
badge, rating, review preview, edit/community action row, "Updated {date}"
footer. They differ in:

- Franchise card shows an "{N} in list" badge on the cover and a "{watched} /
  {total} in list completed" hint line with no per-anime equivalent.
- Franchise card's "Edit" action is conditional on `franchiseEntry` existing
  (shows "Set Status" + a create-mutation when it doesn't); the per-anime card
  always has an entry (list membership implies it exists) so always shows
  "Edit".
- Year-range display ("Series" suffix) vs. plain year on standalone anime —
  already reading from the shared `yearRangeLabel` helper
  (`src/utils/franchise.ts`) as of this repo's last `/simplify` pass.

### Proposed shape

A presentational `ProfileListCard` shell taking slots/props for the parts
that vary, with each of `MyAnimeListItem`/`MyFranchiseListItem` becoming a
thin adapter that supplies its own data-fetching/mutation logic and passes
slot content down:

```ts
interface ProfileListCardProps {
  href: string;
  coverUrl?: string | null;
  title: string;
  badge?: React.ReactNode;       // "{N} in list" — franchise only
  metaLine?: React.ReactNode;    // year / "year · Series"
  status: AnimeStatus | null;    // null → "No series status" outline badge
  rating: number | null;
  reviewText: string | null;
  hintLine?: React.ReactNode;    // "{watched}/{total} in list completed" — franchise only
  updatedAt?: string;
  primaryAction: { label: string; onClick: () => void; disabled?: boolean } | null; // null when !isOwnProfile
}
```

## Migration plan

1. Land the two hooks/shells (`useListStatusEntry`, `ProfileListCard`) and the
   `EntryEditModal` generalization as pure additions — no call-site changes
   in the same commit, so each is independently reviewable.
2. Migrate `AddToListButton` → `useListStatusEntry`, verify status
   add/update/dropdown/click-outside behavior manually (no per-anime status
   change is currently covered by any test).
3. Migrate `FranchiseListButton` the same way; verify the "no entry yet →
   Track Whole Series → picker → creates entry" path, since it has an extra
   branch (`add` vs `update`) the per-anime button also has but is worth
   re-checking given the different default entry state.
4. Migrate `MyAnimeListItem`/`MyFranchiseListItem` → `ProfileListCard`; verify
   both the single-anime and multi-season franchise rendering on a real
   profile page (`/profile/:username`), including the `isOwnProfile` action
   variants.
5. Migrate `EditListEntryModal`/`EditFranchiseEntryModal` → `EntryEditModal`;
   this is the highest-risk one because of the "mark seasons completed"
   second screen — verify: opening the modal, changing status without hitting
   `completed`, hitting `completed` for the first time (prompt appears),
   re-opening an already-`completed` entry and re-saving `completed` (prompt
   should NOT reappear per current behavior), and delete.
6. Delete the old duplicate files once each migration step is verified.

## Acceptance criteria

- No behavior change on any of the six original components' happy paths or
  edge cases listed above.
- `npm run build` (tsc + vite build) and `npm run lint` stay clean.
- Line count reduction: the three pairs currently total ~1,101 lines combined;
  expect this to drop substantially since the majority of each "duplicate" is
  now shared.
- No new special-casing of "is this a franchise" leaks into the per-anime
  components — the shared abstractions should take the varying pieces as
  props/config, not branch internally on a franchise flag.

## Out of scope

- Any change to the underlying `user_anime_entries` / `user_franchise_entries`
  data model or the "never auto-reconciled" relationship between per-season
  and series-level status (see `CLAUDE.md`'s **Database schema** section).
- Adding a test suite. If one gets added to the repo before this work starts,
  write coverage for these three components as part of this migration instead
  of doing it by hand.
