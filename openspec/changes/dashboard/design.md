# Design: Dashboard View

## Technical Approach

Rewrite `index.astro` as the dashboard screen. A single `GetDashboardData` use case orchestrates `findAll()` + `getProgress()` in parallel, returning `{ dates, progress }`. The page frontmatter instantiates `SupabaseDateRepository`, passes it to the use case, and destructures the result. Three new presentational components (`ProgressBar`, `DateCard`, and the page itself) render the data. All styles use Astro scoped `<style>` blocks — matching the existing `TimeCounter.astro` pattern — with SCSS variables from `_variables.scss`.

## Architecture Decisions

| Decision | Options | Choice | Rationale |
|----------|---------|--------|-----------|
| Use case granularity | (A) Direct repo call from page, (B) Two separate use cases, (C) Single `GetDashboardData` | **C** | Matches existing use-case pattern (`AuthenticateUser`, `VerifySession`); keeps page thin; easy to unit test; one `Promise.all` for parallel fetch |
| Style approach | (A) SCSS modules (`.module.scss`), (B) Astro scoped `<style>` | **B** | No `.module.scss` files exist yet; `TimeCounter.astro` uses scoped `<style>` — follow existing convention |
| Grid responsive strategy | (A) Explicit breakpoint overrides, (B) `auto-fill` only | **B** | `repeat(auto-fill, minmax(220px, 1fr))` naturally produces 1→2→3→4→5 cols at 320→480→768→1024→1280px — matches spec REQ-DASH-005 without any media query |
| Progress bar animation | (A) JS-driven animation, (B) CSS `transition` on inline `width` | **B** | SSR-friendly; no client JS needed; `transition: width 1s ease-out` on the fill element animates on first paint |
| Card icon strategy | (A) External SVG files, (B) Inline SVG in template | **B** | Only 2 icons (lock, heart); inline avoids HTTP requests and keeps the component self-contained |
| BaseLayout title | (A) Hardcoded title, (B) Optional `title` prop with default | **B** | Dashboard needs "DatesTogether \| Dashboard"; login page may need a different title later; backward-compatible with default |
| Error handling in use case | (A) Throw to page, (B) Catch and return empty state | **B** | Matches `VerifySession` pattern (catch → return null/empty); page checks `dates.length === 0` for error UI |

## Data Flow

```
Browser Request
      │
      ▼
index.astro (SSR frontmatter)
      │
      ├─ new SupabaseDateRepository()
      ├─ new GetDashboardData(repo)
      ├─ dashboard.execute()
      │       │
      │       ├─ Promise.all([
      │       │     repo.findAll(),      ──→ Supabase dates table (ordered by order_index)
      │       │     repo.getProgress(),  ──→ Supabase dates table (count queries)
      │       │   ])
      │       │
      │       └─ returns { dates: DateEntry[], progress: { completed, total } }
      │
      ├─ <TimeCounter togetherSince={...} client:load />
      ├─ <ProgressBar completed={...} total={...} />
      └─ dates.map(d => <DateCard date={d} />)
              │
              ▼
         HTML response → Browser
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/core/use-cases/GetDashboardData.ts` | Create | Use case: parallel fetch dates + progress, catch errors |
| `src/core/use-cases/index.ts` | Modify | Add `export { GetDashboardData }` |
| `src/presentation/components/ProgressBar.astro` | Create | Animated progress bar with fill + label |
| `src/presentation/components/DateCard.astro` | Create | Card with 3 visual states, inline SVG icons |
| `src/presentation/pages/index.astro` | Modify | Complete rewrite: SSR dashboard with header + grid |
| `src/presentation/layouts/BaseLayout.astro` | Modify | Add optional `title` prop (default: "DatesTogether") |
| `src/presentation/styles/_variables.scss` | Modify | Add `$radius-xl: 1rem` for card border-radius |

## Interfaces / Contracts

### GetDashboardData

```typescript
// src/core/use-cases/GetDashboardData.ts
import type { DateRepository } from '../ports/DateRepository.js';
import type { DateEntry } from '../entities/DateEntry.js';

export interface DashboardData {
  dates: DateEntry[];
  progress: { completed: number; total: number };
}

export class GetDashboardData {
  constructor(private dateRepository: DateRepository) {}

  async execute(): Promise<DashboardData> {
    try {
      const [dates, progress] = await Promise.all([
        this.dateRepository.findAll(),
        this.dateRepository.getProgress(),
      ]);
      return { dates, progress };
    } catch {
      return { dates: [], progress: { completed: 0, total: 0 } };
    }
  }
}
```

### ProgressBar Props

```typescript
export interface Props {
  completed: number;
  total: number;
}
```

Percentage: `total > 0 ? Math.round((completed / total) * 100) : 0`. Fill width set via inline `style="width: {percentage}%"`. CSS transition animates from 0 on first paint.

### DateCard Props

```typescript
import type { DateEntry } from '../../core/entities/DateEntry.js';
export interface Props { date: DateEntry }
```

Display logic:
- `category === 'free'` && `!completed` → title displays "Espacio libre"
- `completed` → badge "Completada" (green), heart icon placeholder
- `!completed` → badge "Pendiente" (coffee), lock icon

### Inline SVG Icons

**Lock icon** (32x32, incomplete state):
```html
<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
</svg>
```

**Heart icon** (32x32, completed state):
```html
<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" stroke="none">
  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
</svg>
```

## Component SCSS Specifications

### ProgressBar

```scss
@use '../styles/variables' as *;

.progress-bar {
  display: flex;
  align-items: center;
  gap: $space-md;
  width: 100%;
}

.progress-bar__track {
  flex: 1;
  height: 12px;
  background: $color-accent-light; // #E8DCC8
  border-radius: 6px;
  overflow: hidden;
}

.progress-bar__fill {
  height: 100%;
  background: $color-primary; // #8B6F47
  border-radius: 6px;
  transition: width 1s ease-out;
}

.progress-bar__label {
  font-size: 0.875rem;
  font-weight: 600;
  color: $color-text; // #3E2A1E
  white-space: nowrap;
}
```

### DateCard

```scss
@use '../styles/variables' as *;

.date-card {
  background: $color-surface;
  border-radius: $radius-xl; // 1rem (16px) — new variable
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(62, 42, 30, 0.08);
  aspect-ratio: 3 / 4;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(62, 42, 30, 0.12);
  }
}

.date-card__media {
  flex: 0 0 60%;
  background: $color-background; // #F5F0E6
  display: flex;
  align-items: center;
  justify-content: center;
  color: $color-text-muted; // lock: #8B7D6B
}

.date-card__media--completed {
  color: $color-primary; // heart: #8B6F47
}

.date-card__info {
  flex: 1;
  padding: $space-md;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.date-card__title {
  font-size: 0.95rem;
  font-weight: 600;
  color: $color-text;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.date-card__badge {
  display: inline-block;
  padding: $space-xs $space-sm;
  border-radius: $radius-md;
  font-size: 0.75rem;
  font-weight: 600;
  align-self: flex-start;
}

.date-card__badge--pending {
  background: rgba(139, 111, 71, 0.1);
  color: $color-primary;
}

.date-card__badge--completed {
  background: rgba(76, 175, 80, 0.1);
  color: #4CAF50;
}
```

### Dashboard Page (index.astro scoped styles)

```scss
@use '../styles/variables' as *;
@use '../styles/mixins' as *;

.dashboard {
  max-width: 1400px;
  margin: 0 auto;
  padding: $space-xl;
}

.dashboard__header {
  margin-bottom: $space-xl;
}

.dashboard__header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-lg;
}

.dashboard__logout {
  padding: $space-sm $space-md;
  background: transparent;
  border: 1px solid $color-border;
  border-radius: $radius-md;
  color: $color-text-muted;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background 0.2s ease, color 0.2s ease;

  &:hover {
    background: $color-primary;
    color: $color-surface;
    border-color: $color-primary;
  }
}

.dashboard__error {
  text-align: center;
  color: $color-error;
  padding: $space-2xl;
  font-size: $font-size-lg;
}

.dates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: $space-lg;
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `GetDashboardData.execute()` — parallel fetch, error fallback, ordering | Mock `DateRepository`, verify `Promise.all` called, verify empty return on throw |
| Unit | `ProgressBar` percentage calculation | Verify `total=0` returns 0%, normal cases compute correctly |
| Integration | `index.astro` frontmatter data flow | Verify SSR renders with mock repository data |
| Visual | Grid responsiveness | Manual browser test at 320/480/768/1024/1280px viewports |

Note: Test infrastructure is not yet configured (`vitest.config.ts` exists but no tests). Unit tests for `GetDashboardData` can be the first test file.

## Migration / Rollout

No migration required. This is a pure presentation layer change — no database schema changes, no API changes. Rollback: revert `index.astro` to placeholder, delete 3 new files, remove barrel export.

## Open Questions

- [ ] Should `BaseLayout` accept a `title` prop now, or should the dashboard override `<title>` via `Astro.props` in a different way? (Recommendation: add optional `title` prop with default — minimal, backward-compatible)
- [ ] The spec mentions "1 col (<480px)" but `auto-fill minmax(220px, 1fr)` produces 1 col at <440px naturally. Is the ~40px difference acceptable? (Recommendation: yes — `auto-fill` is cleaner and the difference is imperceptible)
