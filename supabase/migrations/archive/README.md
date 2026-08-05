# Archived migrations

These ran against the production project before `20260101000000_baseline_schema.sql`
existed. The baseline captures the `public`-schema state they produced, so replaying
them would double-apply — `20260727210957` in particular converts
`friendships.status` to an enum, which fails once the baseline has already created
it that way.

**The baseline covers `public` only.** That gap already bit once: `20260802185750`
hardens policies on `storage.objects`, which the baseline does not describe, and
the avatars bucket it patches was created through the dashboard and appears in no
migration at all — so a database built from source had no bucket and no storage RLS
until `20260805172434_avatar_storage_bucket_and_policies.sql` reproduced both.
Before archiving anything else, check whether it touches a schema outside `public`.

They are kept because their comments explain *why* the security model looks the
way it does — the friendship privilege-escalation hole, the no-op column revoke,
the auto-updatable-view risk. That reasoning is carried forward into the
baseline's comments, but the original write-ups have more detail than belongs in
a schema file.

Supabase only reads `*.sql` directly inside `migrations/`, so nothing in this
directory is ever executed.

Seventeen further migrations exist in the production migration history with no
file in this repo at all — they were applied through the dashboard or MCP. Their
SQL is recoverable from `supabase_migrations.schema_migrations.statements` on the
remote project if it's ever needed; their end state is already in the baseline.
