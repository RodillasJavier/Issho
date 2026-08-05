# Archived migrations

These ran against the production project before `20260101000000_baseline_schema.sql`
existed. The baseline captures the schema they produced, so replaying them would
double-apply — `20260727210957` in particular converts `friendships.status` to an
enum, which fails once the baseline has already created it that way.

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
