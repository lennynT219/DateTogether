# Design: Supabase Database Layer

## Technical Approach

Extend existing domain entities with DB-required fields, define repository ports in `src/core/ports/`, implement them with `@supabase/supabase-js` using a singleton server-side client with `service_role` key. Two SQL migrations: schema DDL + seed data. No RLS — Astro middleware is the auth boundary.

## Architecture Decisions

| Decision | Choice | Alternative | Rationale |
|----------|--------|-------------|-----------|
| Client lifecycle | Singleton per server instance | Per-request factory | 2-user app, no session leakage risk with `persistSession: false`; avoids cold-start overhead |
| Entity strategy | Extend existing interfaces | Separate DB DTOs + entities | Single source of truth; no mapping ceremony at domain boundary |
| Type generation | Manual `DateRow`/`MemoryRow` types | Supabase CLI `gen types` | CLI requires project connection; manual types are sufficient for 2 tables |
| Seed approach | SQL INSERT in migration | Runtime seeder script | Idempotent, versioned, runs with `db push` |
| Repository return | Entities with nested memories | Separate queries composed in use-cases | `findAll` is the hot path (grid render); composing in repo avoids N+1 |

## Data Flow

```
API Route / Page (Astro SSR)
    │
    ▼
Use Case (src/core/use-cases/)
    │
    ▼
Repository Port (src/core/ports/DateRepository.ts)
    │
    ▼
SupabaseDateRepository (src/infrastructure/repositories/)
    │
    ├── getSupabaseClient() ──→ Supabase REST API ──→ PostgreSQL
    │
    └── mapRowToDateEntry() ──→ DateEntry (camelCase)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/core/entities/DateEntry.ts` | Modify | Add `orderIndex`, `completedBy?`, `createdAt`, `updatedAt` |
| `src/core/entities/Memory.ts` | Modify | Add `createdBy?` |
| `src/core/ports/DateRepository.ts` | Create | Port interface (6 methods) |
| `src/core/ports/MemoryRepository.ts` | Create | Port interface (3 methods) |
| `src/core/ports/index.ts` | Modify | Export new ports |
| `src/infrastructure/database/supabase-client.ts` | Create | Singleton factory |
| `src/infrastructure/database/types.ts` | Create | `DateRow`, `MemoryRow` snake_case types |
| `src/infrastructure/repositories/SupabaseDateRepository.ts` | Create | Implementation + mappers |
| `src/infrastructure/repositories/SupabaseMemoryRepository.ts` | Create | Implementation + mappers |
| `src/infrastructure/repositories/index.ts` | Modify | Export new repositories |
| `supabase/migrations/20260702000000_initial_schema.sql` | Create | DDL: tables, indexes, trigger |
| `supabase/migrations/20260702000001_seed_dates.sql` | Create | 100 INSERT statements |
| `astro.config.mjs` | Modify | Add `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` to env schema |
| `package.json` | Modify | Add `@supabase/supabase-js` |

## Interfaces / Contracts

### Entity Extensions

```typescript
// DateEntry.ts — extended
export interface DateEntry {
  id: string;
  title: string;
  description?: string;
  category: 'predefined' | 'free';
  orderIndex: number;
  completed: boolean;
  completedAt?: Date;
  completedBy?: string;
  memories: Memory[];
  createdAt: Date;
  updatedAt: Date;
}

// Memory.ts — extended
export interface Memory {
  id: string;
  dateId: string;
  imageUrl: string;
  note?: string;
  location?: string;
  createdBy?: string;
  createdAt: Date;
}
```

### Repository Ports

```typescript
// DateRepository.ts
export interface DateRepository {
  findAll(): Promise<DateEntry[]>;
  findById(id: string): Promise<DateEntry | null>;
  findByCategory(category: 'predefined' | 'free'): Promise<DateEntry[]>;
  markAsCompleted(id: string, completedBy: string): Promise<DateEntry>;
  markAsIncomplete(id: string): Promise<DateEntry>;
  getProgress(): Promise<{ completed: number; total: number }>;
}

// MemoryRepository.ts
export interface MemoryRepository {
  findByDateId(dateId: string): Promise<Memory[]>;
  create(memory: Omit<Memory, 'id' | 'createdAt'>): Promise<Memory>;
  delete(id: string): Promise<void>;
}
```

### Supabase Client Factory

```typescript
// supabase-client.ts
import { createClient } from '@supabase/supabase-js';

let client: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (client) return client;
  const url = import.meta.env.SUPABASE_URL;
  const key = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error('SUPABASE_URL is not set');
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
```

### Row-to-Entity Mappers

Mappers live inside each repository file (private functions). They convert `snake_case` DB rows to `camelCase` entities, mapping `null` → `undefined` for optional fields.

### SQL Schema (key points)

- `pgcrypto` extension for `gen_random_uuid()`
- `dates.order_index` UNIQUE constraint (1-100)
- `memories.date_id` FK → `dates(id)` ON DELETE CASCADE
- `updated_at` trigger on `dates` table
- Indexes: `dates(order_index)`, `memories(date_id)`

### Seed SQL

100 rows: 90 predefined (order_index 1-90, category='predefined') + 10 free (order_index 91-100, title=NULL, category='free'). Titles from spec table. See Open Questions for #36 and #37/#47 issues.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Type check | All new files compile | `tsc --noEmit` |
| Build | Astro build succeeds | `bun run build` |
| Manual | Migrations run, 100 rows exist | Supabase dashboard SQL editor |

No test runner configured — verification is type-check + build + manual DB inspection.

## Migration / Rollout

1. Run `bun add @supabase/supabase-js`
2. Add env vars to `.env` and `astro.config.mjs`
3. Apply migrations via Supabase dashboard SQL editor (or `supabase db push` if CLI connected)
4. Verify: `SELECT count(*) FROM dates` → 100, `SELECT count(*) FROM memories` → 0
5. Deploy: Netlify picks up new env vars from dashboard settings

Rollback: Drop tables, remove dependency, delete new files, remove env vars.

## Open Questions

- [ ] **Seed #36**: Spec marks order_index 36 as "(reserved — OCR ambiguous)". PDF page 46 shows "VESTIR IGUALES" between "ARMAR UN LEGO" (page 45) and "DISFRAZ EN PAREJA" (page 47). Recommendation: use "Vestir iguales" for #36 and shift spec #46-90 titles down by one, OR keep spec as-is and use a placeholder like "Cita sorpresa" for #36. Needs manual verification.
- [ ] **Seed #37/#47 duplicate**: Spec has "Disfraz en pareja" at both order_index 37 and 47. If #36 becomes "Vestir iguales", then #37 stays "Disfraz en pareja" and #47 needs a different title. Needs manual verification.
- [ ] **Seed #79**: Spec says "Ir a un concierto" but PDF page 79 has no visible title. PDF page 91 shows a garbled title that could be "Ir a un concierto". Acceptable guess but flagged for verification.
