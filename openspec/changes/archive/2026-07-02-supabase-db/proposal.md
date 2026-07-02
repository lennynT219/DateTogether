# Proposal: Supabase Database Layer

## Intent

Add PostgreSQL persistence via Supabase for the 100-dates app. Currently, no data layer exists beyond env-based auth. The app needs to store date entries (90 predefined + 10 free), track completion state, and persist memories (photos, notes, locations) per date. Supabase is the database only — auth remains custom JWT.

## Scope

### In Scope
- `dates` and `memories` tables with indexes and triggers
- Seed migration: 90 predefined dates (from PDF OCR) + 10 free slots
- `DateRepository` and `MemoryRepository` ports in `src/core/ports/`
- Supabase implementations in `src/infrastructure/repositories/`
- Server-only Supabase client factory (service_role key, no RLS)
- `@supabase/supabase-js` dependency

### Out of Scope
- Supabase Auth (custom JWT stays)
- Row Level Security (server-side middleware controls access)
- Cloudinary image upload (separate change)
- UI for browsing/completing dates (separate change)
- Real-time subscriptions (unnecessary for 2-user app)
- Supabase CLI type generation (manual types for now)

## Capabilities

### New Capabilities
- `supabase-database`: Schema, seed data, Supabase client factory, and repository implementations for date entries and memories

### Modified Capabilities
- `clean-architecture`: Add `DateRepository` and `MemoryRepository` ports; extend infrastructure layer with database and repository modules

## Approach

Server-side Supabase client using `createClient` with service_role key and `persistSession: false`. No RLS — the Astro middleware + API routes are the authorization boundary (auth-system change). Repositories map between snake_case DB rows and camelCase domain entities. Two SQL migrations: schema DDL + seed data.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `supabase/migrations/` | New | DDL + seed SQL (2 files) |
| `src/core/ports/DateRepository.ts` | New | Port interface for date CRUD |
| `src/core/ports/MemoryRepository.ts` | New | Port interface for memory CRUD |
| `src/infrastructure/database/` | New | Supabase client factory + DB types |
| `src/infrastructure/repositories/` | New | SupabaseDateRepository, SupabaseMemoryRepository |
| `package.json` | Modified | Add `@supabase/supabase-js` |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| service_role key exposure | Low | Astro env schema `access: 'secret'`; never imported client-side |
| No RLS — app-layer bug exposes data | Low | 2-user private app; middleware already tested in auth-system |
| OCR seed titles have artifacts | High | Manual cleanup pass before writing seed SQL |
| Netlify cold start + DB latency | Med | Per-request client factory; no connection pooling needed for 2 users |

## Rollback Plan

1. Drop `dates` and `memories` tables from Supabase dashboard
2. Remove `@supabase/supabase-js` from `package.json`
3. Delete `supabase/migrations/`, `src/infrastructure/database/`, new repository files, and new port files
4. Remove `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from env config

## Dependencies

- `@supabase/supabase-js` (npm)
- Supabase project created with URL and service_role key available as env vars

## Success Criteria

- [ ] `bun run build` passes with new files
- [ ] `tsc --noEmit` passes (type-safe repository implementations)
- [ ] Migrations run successfully against Supabase project
- [ ] 100 seed rows exist (90 predefined + 10 free)
- [ ] Repository ports match existing entity interfaces (`DateEntry`, `Memory`)
