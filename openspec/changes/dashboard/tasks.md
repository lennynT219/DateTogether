# Tasks: Dashboard View

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~300 (4 new files + 3 modified) |
| 400-line budget risk | Medium |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (use case + layout) → PR 2 (components) → PR 3 (page wiring) |
| Delivery strategy | force-chained |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Use case + barrel + BaseLayout title prop | PR 1 | ~35 lines; foundation layer, no UI |
| 2 | ProgressBar + DateCard components | PR 2 | ~180 lines; self-contained presentational components |
| 3 | index.astro rewrite + variables update | PR 3 | ~85 lines; wires everything together |

## Phase 1: Foundation — Use Case & Layout

- [x] 1.1 Create `src/core/use-cases/GetDashboardData.ts` — inject `DateRepository`, `execute()` calls `Promise.all([findAll(), getProgress()])`, catch returns `{ dates: [], progress: { completed: 0, total: 0 } }`. Export `DashboardData` interface.
  - **Verify**: `tsc --noEmit` passes; file compiles with correct imports from `../ports/DateRepository.js` and `../entities/DateEntry.js`

- [x] 1.2 Add `export { GetDashboardData } from './GetDashboardData.js'` to `src/core/use-cases/index.ts`
  - **Verify**: `import { GetDashboardData } from '../../core/use-cases/index.js'` resolves

- [x] 1.3 Modify `src/presentation/layouts/BaseLayout.astro` — add optional `title` prop with default `"DatesTogether"`, replace hardcoded `<title>` with dynamic value
  - **Verify**: existing `login.astro` still renders title "DatesTogether"; `tsc --noEmit` passes

## Phase 2: Presentational Components

- [x] 2.1 Create `src/presentation/components/ProgressBar.astro` — Props: `{ completed: number; total: number }`. Compute percentage (`total > 0 ? Math.round((completed / total) * 100) : 0`). Render track + fill div with inline `style="width: {percentage}%"` + label `"X / 100"`. Scoped `<style>` with SCSS variables: track `$color-accent-light`, fill `$color-primary`, `transition: width 1s ease-out`.
  - **Verify**: component renders; `completed=50, total=100` → fill width 50%, text "50 / 100"; `total=0` → 0%

- [x] 2.2 Create `src/presentation/components/DateCard.astro` — Props: `{ date: DateEntry }`. Semantic `<article>` with `data-date-id`, `data-completed`, `data-category` attributes. 3:4 aspect ratio. Two states: incomplete (lock inline SVG + title/"Espacio libre" + "Pendiente" badge) and completed (heart inline SVG + gray placeholder + "Completada" badge). Scoped `<style>` using `$color-surface`, `$color-background`, `$color-primary`, `$color-text`, `$color-text-muted`, `$radius-xl`. Hover: `translateY(-4px)` + shadow.
  - **Verify**: `data-date-id`, `data-completed`, `data-category` present on `<article>`; free incomplete shows "Espacio libre"; completed shows heart icon; `tsc --noEmit` passes

## Phase 3: Dashboard Page Wiring

- [x] 3.1 Add `$radius-xl: 1rem;` to `src/presentation/styles/_variables.scss` after `$radius-lg`
  - **Verify**: variable available for import; no SCSS compilation errors

- [x] 3.2 Rewrite `src/presentation/pages/index.astro` — `export const prerender = false`. Frontmatter: import `SupabaseDateRepository` from `../../infrastructure/repositories/index.js`, import `GetDashboardData` from `../../core/use-cases/index.js`, instantiate repo + use case, call `execute()`. Render `<BaseLayout title="DatesTogether | Dashboard">`, header with `<TimeCounter togetherSince={import.meta.env.TOGETHER_SINCE} client:load />`, `<ProgressBar>`, logout form (`POST /api/auth/logout`). Grid: `dates.map(d => <DateCard date={d} />)`. Error state: if `dates.length === 0`, render "No se pudieron cargar las citas". Scoped `<style>` with `.dashboard`, `.dashboard__header`, `.dashboard__header-top`, `.dashboard__logout`, `.dashboard__error`, `.dates-grid` (`repeat(auto-fill, minmax(220px, 1fr))`, `gap: $space-lg`).
  - **Verify**: `bun run build` passes; page renders header with TimeCounter + ProgressBar + logout; grid contains DateCards; error message shows on empty data

## Phase 4: Verification

- [x] 4.1 Run `tsc --noEmit` — zero errors expected
- [x] 4.2 Run `bun run build` — zero errors expected, SSR output includes dashboard markup
- [x] 4.3 Manual check: verify grid responsiveness at 320px, 480px, 768px, 1024px, 1280px viewports (note: manual verification pending — auto-fill grid should handle all breakpoints naturally)
