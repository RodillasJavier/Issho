/**
 * scripts/backfill-anilist.ts
 *
 * One-time, resumable backfill: for every anime row still keyed only by its
 * MAL id (anilist_id IS NULL), fetch the AniList counterpart, map its fields,
 * resolve its franchise key, and update the row. Rows with no AniList
 * counterpart are logged for manual review and left untouched.
 *
 * Usage:
 *   npx tsx scripts/backfill-anilist.ts [--dry-run] [--limit N] [--emit-sql <file>]
 *
 * Writes require SUPABASE_SERVICE_ROLE_KEY in .env (reads work with the anon
 * key, so --dry-run and --emit-sql do not need it). Safe to re-run after a
 * crash or an AniList outage — already-backfilled rows are skipped.
 */
import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "node:fs";
import {
  getAnimeByMalId,
  withRetry,
  AniListDisabledError,
} from "../src/services/anilistApi";
import {
  createResolveContext,
  resolveFranchiseKey,
} from "../src/services/anilistFranchise";
import { createKnownFranchiseLookup } from "../src/api/franchiseLookup";
import { mapAniListToAnime } from "../src/api/animeMapping";
import type { AnimeInsert } from "../src/types/database.types";

const SUPABASE_URL = "https://tshtiffutyauyzfcekuq.supabase.co";
const WRITE_BATCH_SIZE = 50;

// #region Setup
try {
  process.loadEnvFile();
} catch {
  // no .env file — rely on the ambient environment
}

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const limitArg = args.indexOf("--limit");
const limit = limitArg >= 0 ? Number(args[limitArg + 1]) : Infinity;
const emitSqlArg = args.indexOf("--emit-sql");
const emitSqlPath = emitSqlArg >= 0 ? args[emitSqlArg + 1] : null;

const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
const writesEnabled = !dryRun && !emitSqlPath;
if (writesEnabled && !serviceKey) {
  console.error(
    "SUPABASE_SERVICE_ROLE_KEY is required to write. Use --dry-run or --emit-sql without it."
  );
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, serviceKey ?? anonKey ?? "");
// #endregion Setup

// #region Helpers
interface PlannedUpdate {
  id: string;
  oldName: string;
  update: AnimeInsert;
}

interface NeedsReview {
  id: string;
  mal_id: number;
  name: string;
  reason: string;
}

const sqlString = (v: string | null): string =>
  v == null ? "NULL" : `'${v.replace(/'/g, "''")}'`;

const sqlNumber = (v: number | null): string => (v == null ? "NULL" : `${v}`);

const toUpdateSql = (p: PlannedUpdate): string => {
  const u = p.update;
  return (
    `UPDATE public.anime SET ` +
    `name = ${sqlString(u.name)}, ` +
    `name_japanese = ${sqlString(u.name_japanese ?? null)}, ` +
    `description = ${sqlString(u.description ?? null)}, ` +
    `cover_image_url = ${sqlString(u.cover_image_url ?? null)}, ` +
    `episode_count = ${sqlNumber(u.episode_count ?? null)}, ` +
    `year = ${sqlNumber(u.year ?? null)}, ` +
    `genres = ${sqlString(u.genres ?? null)}, ` +
    `status = ${sqlString(u.status ?? null)}, ` +
    `mal_url = ${sqlString(u.mal_url ?? null)}, ` +
    `anilist_id = ${sqlNumber(u.anilist_id ?? null)}, ` +
    `mal_id = ${sqlNumber(u.mal_id ?? null)}, ` +
    `format = ${sqlString(u.format ?? null)}, ` +
    `anilist_url = ${sqlString(u.anilist_url ?? null)}, ` +
    `franchise_key = ${sqlNumber(u.franchise_key ?? null)}, ` +
    `franchise_title = ${sqlString(u.franchise_title ?? null)}, ` +
    `updated_at = now() ` +
    `WHERE id = '${p.id}';`
  );
};

const lookupKnownFranchise = createKnownFranchiseLookup(supabase);

const flushUpdates = async (updates: PlannedUpdate[]): Promise<void> => {
  if (!writesEnabled || updates.length === 0) return;
  for (let i = 0; i < updates.length; i += WRITE_BATCH_SIZE) {
    const batch = updates.slice(i, i + WRITE_BATCH_SIZE);
    await Promise.all(
      batch.map(async (p) => {
        const { error } = await supabase
          .from("anime")
          .update({ ...p.update, updated_at: new Date().toISOString() })
          .eq("id", p.id);
        if (error) {
          throw new Error(`Failed updating anime ${p.id}: ${error.message}`);
        }
      })
    );
    console.log(
      `  flushed ${Math.min(i + WRITE_BATCH_SIZE, updates.length)}/${updates.length} updates`
    );
  }
};
// #endregion Helpers

// #region Main
const main = async () => {
  const { data: rows, error } = await supabase
    .from("anime")
    .select("id, name, external_id, mal_id, anilist_id")
    .is("anilist_id", null)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`Failed reading anime rows: ${error.message}`);

  const pending = (rows ?? [])
    .filter((r) => r.mal_id != null || r.external_id != null)
    .slice(0, limit);
  console.log(
    `${rows?.length ?? 0} rows without anilist_id; processing ${pending.length}` +
      (dryRun ? " (dry run — nothing will be written)" : "")
  );

  const ctx = createResolveContext(lookupKnownFranchise);
  const updates: PlannedUpdate[] = [];
  const needsReview: NeedsReview[] = [];
  let stoppedEarly = false;

  for (const row of pending) {
    const malId: number = row.mal_id ?? row.external_id;
    try {
      const media = await withRetry(() => getAnimeByMalId(malId));
      if (!media) {
        needsReview.push({
          id: row.id,
          mal_id: malId,
          name: row.name,
          reason: "no AniList counterpart",
        });
        console.log(`  ✗ MAL ${malId} "${row.name}" — no AniList counterpart`);
        continue;
      }

      const franchise = await resolveFranchiseKey(media, ctx);
      updates.push({
        id: row.id,
        oldName: row.name,
        update: mapAniListToAnime(media, franchise),
      });
      console.log(
        `  ✓ MAL ${malId} → AniList ${media.id} "${media.title.english ?? media.title.romaji}"` +
          ` [franchise ${franchise.key} "${franchise.title}"]`
      );
    } catch (e) {
      if (e instanceof AniListDisabledError) {
        console.warn(
          "AniList is temporarily disabled (403). Stopping cleanly — re-run to resume."
        );
        stoppedEarly = true;
        break;
      }
      needsReview.push({
        id: row.id,
        mal_id: malId,
        name: row.name,
        reason: e instanceof Error ? e.message : String(e),
      });
      console.warn(`  ! MAL ${malId} "${row.name}" — ${e}`);
    }
  }

  await flushUpdates(updates);

  if (emitSqlPath) {
    const sql = updates.map(toUpdateSql).join("\n") + "\n";
    writeFileSync(emitSqlPath, sql);
    console.log(
      `\nWrote ${updates.length} UPDATE statements to ${emitSqlPath}`
    );
  }

  // Summary
  const franchises = new Set(updates.map((p) => p.update.franchise_key));
  console.log(`\n=== Summary ===`);
  console.log(`Matched:        ${updates.length}`);
  console.log(`Needs review:   ${needsReview.length}`);
  for (const r of needsReview) {
    console.log(`  - ${r.name} (MAL ${r.mal_id}, id ${r.id}): ${r.reason}`);
  }
  console.log(`Franchises:     ${franchises.size}`);
  const renames = updates.filter((p) => p.oldName !== p.update.name);
  if (renames.length > 0) {
    console.log(`Renamed titles: ${renames.length}`);
    for (const p of renames) {
      console.log(`  - "${p.oldName}" → "${p.update.name}"`);
    }
  }
  if (stoppedEarly) {
    console.log(`Stopped early on AniList outage — re-run to resume.`);
  }
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
// #endregion Main
