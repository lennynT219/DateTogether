# Tasks: Supabase Database Layer

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~420 (14 files: 6 modified, 8 created) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (Foundation + Ports) → PR 2 (Repositories) → PR 3 (Migrations + Verify) |
| Delivery strategy | force-chained |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Dependency, entity extensions, DB types, ports, client factory, env config | PR 1 | ~100 lines; self-contained domain + infra skeleton |
| 2 | SupabaseDateRepository + SupabaseMemoryRepository + barrel exports | PR 2 | ~150 lines; depends on PR 1 types/ports |
| 3 | SQL schema migration, seed migration, typecheck, build | PR 3 | ~170 lines (seed is ~105); depends on PR 1+2 |

## Phase 1: Foundation

- [x] 1.1 Run `bun add @supabase/supabase-js` — verify `package.json` has the dependency
- [x] 1.2 Extend `src/core/entities/DateEntry.ts` — add `orderIndex: number`, `completedBy?: string`, `createdAt: Date`, `updatedAt: Date`
- [x] 1.3 Extend `src/core/entities/Memory.ts` — add `createdBy?: string`
- [x] 1.4 Create `src/infrastructure/database/types.ts` — define `DateRow` and `MemoryRow` snake_case interfaces matching SQL schema
- [x] 1.5 Create `src/infrastructure/database/supabase-client.ts` — singleton `getSupabaseClient()` with `persistSession: false`, throws on missing env vars
- [x] 1.6 Update `astro.config.mjs` — add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to `env.schema` with `access: 'secret'`

## Phase 2: Ports

- [x] 2.1 Create `src/core/ports/DateRepository.ts` — interface with `findAll`, `findById`, `findByCategory`, `markAsCompleted`, `markAsIncomplete`, `getProgress`
- [x] 2.2 Create `src/core/ports/MemoryRepository.ts` — interface with `findByDateId`, `create`, `delete`
- [x] 2.3 Update `src/core/ports/index.ts` — export `DateRepository` and `MemoryRepository` types

## Phase 3: Repository Implementations

- [x] 3.1 Create `src/infrastructure/repositories/SupabaseDateRepository.ts` — implement `DateRepository`, private `mapRowToDateEntry()` mapper (snake_case → camelCase, null → undefined), `findAll` joins memories
- [x] 3.2 Create `src/infrastructure/repositories/SupabaseMemoryRepository.ts` — implement `MemoryRepository`, private `mapRowToMemory()` mapper, `create` returns entity with populated `id` + `createdAt`
- [x] 3.3 Update `src/infrastructure/repositories/index.ts` — export both repository implementations

## Phase 4: SQL Migrations

- [x] 4.1 Create `supabase/migrations/20260702000000_initial_schema.sql` — `pgcrypto` extension, `dates` table (10 columns, UNIQUE on `order_index`), `memories` table (7 columns, FK CASCADE), indexes on `dates(order_index)` and `memories(date_id)`, `updated_at` trigger function + trigger on `dates`
- [x] 4.2 Create `supabase/migrations/20260702000001_seed_dates.sql` — 90 predefined INSERTs (order_index 1-90 with titles from spec) + 10 free INSERTs (order_index 91-100, title=NULL). Flag #36, #37/#47, #79 OCR-ambiguous titles with comments for manual review

## Phase 5: Verification

- [x] 5.1 Run `bun run typecheck` — must pass with zero errors
- [x] 5.2 Run `bun run build` — must succeed
