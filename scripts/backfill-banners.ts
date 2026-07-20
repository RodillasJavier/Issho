/**
 * scripts/backfill-banners.ts
 *
 * One-time backfill of anime.banner_image_url from AniList's bannerImage for
 * rows imported before the column existed. Idempotent: only rows with a NULL
 * banner are fetched. Usage:
 *
 *   npx tsx scripts/backfill-banners.ts [--emit-sql <file>]
 *
 * Direct writes need SUPABASE_SERVICE_ROLE_KEY in .env; --emit-sql works with
 * the anon key (reads are public).
 */
import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "node:fs";
import { anilist, withRetry } from "../src/services/anilistApi";

const SUPABASE_URL = "https://tshtiffutyauyzfcekuq.supabase.co";

const BANNER_QUERY = `
query Banner($id: Int) { Media(id: $id, type: ANIME) { id bannerImage } }`;

try {
  process.loadEnvFile();
} catch {
  // no .env file — rely on the ambient environment
}

const args = process.argv.slice(2);
const emitSqlArg = args.indexOf("--emit-sql");
const emitSqlPath = emitSqlArg >= 0 ? args[emitSqlArg + 1] : null;

const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
if (!emitSqlPath && !serviceKey) {
  console.error(
    "SUPABASE_SERVICE_ROLE_KEY is required to write; use --emit-sql without it."
  );
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, serviceKey ?? anonKey ?? "");

const main = async () => {
  const { data: rows, error } = await supabase
    .from("anime")
    .select("id, name, anilist_id")
    .not("anilist_id", "is", null)
    .is("banner_image_url", null)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);

  console.log(`${rows?.length ?? 0} rows without a banner`);
  const statements: string[] = [];
  let found = 0;

  for (const row of rows ?? []) {
    const data = await withRetry(() =>
      anilist<{ Media: { id: number; bannerImage: string | null } | null }>(
        BANNER_QUERY,
        { id: row.anilist_id }
      )
    );
    const banner = data.Media?.bannerImage ?? null;
    console.log(`  ${banner ? "✓" : "·"} ${row.name}`);
    if (!banner) continue;
    found++;

    if (emitSqlPath) {
      statements.push(
        `UPDATE public.anime SET banner_image_url = '${banner.replace(/'/g, "''")}' WHERE id = '${row.id}';`
      );
    } else {
      const { error: updateError } = await supabase
        .from("anime")
        .update({ banner_image_url: banner })
        .eq("id", row.id);
      if (updateError) throw new Error(updateError.message);
    }
  }

  if (emitSqlPath) {
    writeFileSync(emitSqlPath, statements.join("\n") + "\n");
    console.log(
      `\nWrote ${statements.length} UPDATE statements to ${emitSqlPath}`
    );
  }
  console.log(`\nBanners found: ${found}/${rows?.length ?? 0}`);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
