# Archive Report: supabase-db

**Change**: supabase-db
**Archived**: 2026-07-02
**Project**: datestogether
**Status**: success

## Summary

Archived the `supabase-db` change after a fully verified implementation. All 16 tasks completed, typecheck and build passed with zero errors, no CRITICAL or WARNING findings. Delta spec synced to `openspec/specs/supabase-database/spec.md` as a new domain, and the change folder moved to `openspec/changes/archive/2026-07-02-supabase-db/`. Three OCR-ambiguous seed titles were resolved during implementation and flagged in the seed SQL with comments for manual user review.

## Task Completion

All 16 implementation tasks verified complete in archived `tasks.md`:

| Phase                                          | Tasks | Status |
| ---------------------------------------------- | ----- | ------ |
| 1. Foundation (deps, entities, DB types, client, env) | 6     | ✅     |
| 2. Ports (DateRepository, MemoryRepository)    | 3     | ✅     |
| 3. Repository Implementations                  | 3     | ✅     |
| 4. SQL Migrations (schema + seed)              | 2     | ✅     |
| 5. Verification (typecheck + build)            | 2     | ✅     |

No unchecked implementation tasks remain.

## Verify Summary

| Check                | Result                                  |
| -------------------- | --------------------------------------- |
| `bun run typecheck`  | ✅ 0 errors                              |
| `bun run build`      | ✅ Netlify SSR function generated        |
| File plan executed   | ✅ 14 files (6 modified, 8 created)     |
| Migrations created   | ✅ 2 SQL files in `supabase/migrations/` |
| OCR-ambiguous titles | ✅ Flagged in seed SQL for manual review |

**Findings**: No CRITICAL issues, no WARNING issues. Three SUGGESTIONS in the seed layer (all OCR ambiguity — see "Spec / Implementation Divergence" below).

## Specs Synced

| Domain              | Action  | Details                                                       |
| ------------------- | ------- | ------------------------------------------------------------- |
| `supabase-database` | Created | 8 requirements, ~25 scenarios — new domain (no prior main spec) |

The delta spec was copied as a new main spec at `openspec/specs/supabase-database/spec.md` because no prior main spec existed for this capability.

> **Scope note**: The proposal listed `clean-architecture` as a "Modified" capability, but the delta spec contains no `MODIFIED Requirements` block for that domain. The clean-architecture spec was NOT modified by this change. The repository port and infrastructure additions live entirely under the new `supabase-database` domain.

## Spec / Implementation Divergence (audit trail)

The delta spec (`openspec/changes/supabase-db/specs/supabase-database/spec.md`) explicitly delegates the wording of OCR-ambiguous seed titles to the design/implementation phase:

> "Titles 36 and 79 have OCR ambiguity. The final seed SQL MUST use manually verified titles. The table above is the spec-level contract; exact wording is a design/implementation concern."

The implementation made the following design decisions during apply (recorded in Engram `sdd/supabase-db/apply-progress`):

| #   | Spec table value     | Implementation value       | Reason                                                   |
| --- | -------------------- | -------------------------- | -------------------------------------------------------- |
| 36  | (reserved)           | "Vestir iguales"           | Recovered from PDF page 46 between #35 and #37            |
| 47  | "Disfraz en pareja"  | "Pijamada"                 | Spec duplicate at #37/#47 resolved by shifting #47       |
| 79  | "Ir a un concierto"  | "Ir a un acuario"          | PDF page 79 had no visible title; best-guess replacement  |

All three titles are flagged with SQL comments in `supabase/migrations/20260702000001_seed_dates.sql` for manual user review on the Supabase dashboard.

The delta spec text is preserved as the historical artifact. The implementation values are the source of truth for what was actually seeded.

## Deviation from Design (file naming)

The design specified `supabase-client.ts` (kebab-case) in the file change table, but the implementation used `SupabaseClient.ts` (PascalCase) per the orchestrator's apply-prompt instruction. Both naming conventions are valid TypeScript; this is a stylistic deviation only and does not affect behavior or contracts.

## Archive Contents

- `proposal.md` ✅
- `design.md` ✅
- `tasks.md` ✅ (16/16 tasks complete)
- `specs/supabase-database/spec.md` ✅ (delta spec preserved)

## Source of Truth Updated

The following spec now exists as the canonical reference for this capability:

- `openspec/specs/supabase-database/spec.md`

## Active Changes

`openspec/changes/` no longer contains `supabase-db`. The remaining active change is `auth-system`.

## Outstanding Manual Steps (for the user)

The implementation is complete and verified locally, but the following require manual action by the user on the Supabase dashboard before the system is fully operational:

1. Create a Supabase project and obtain `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
2. Apply `supabase/migrations/20260702000000_initial_schema.sql` via the Supabase SQL editor.
3. Apply `supabase/migrations/20260702000001_seed_dates.sql` via the Supabase SQL editor.
4. Verify: `SELECT count(*) FROM dates` returns 100.
5. Add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to `.env` and to the Netlify environment variables for production.
6. Manually review the three flagged seed titles (#36, #47, #79) and update the SQL if corrections are needed.

## SDD Cycle Complete

The change has been fully planned, implemented, verified, and archived. Ready for the next change.
