# Proposal: Dashboard View

## Intent

Transform the placeholder `index.astro` into a functional dashboard that displays the 100-date grid, progress tracker, and relationship time counter. Users need to see their dates at a glance, track completion progress, and navigate the challenge — this is the app's core screen.

## Scope

### In Scope

- `GetDashboardData` use case: orchestrates `findAll()` + `getProgress()` via `DateRepository` port
- `ProgressBar.astro`: animated fill bar showing "X / 100" completion
- `DateCard.astro`: card component with 3 visual states (predefined incomplete, free incomplete, completed)
- `index.astro` rewrite: SSR frontmatter data fetch, responsive CSS Grid layout, header with TimeCounter + ProgressBar + logout
- SCSS grid styles using existing `_mixins.scss` breakpoints

### Out of Scope

- Scratch-off Canvas effect (change #6)
- Polaroid + Flip 3D animation (change #7)
- Cloudinary image upload (change #8)
- `UnlockDate` use case (change #9)
- Individual date detail page
- Real-time updates

## Capabilities

### New Capabilities

- `dashboard-view`: Dashboard page rendering with date grid, progress bar, time counter, and server-side data orchestration via `GetDashboardData` use case

### Modified Capabilities

None

## Approach

Single screen-level use case (`GetDashboardData`) injects `DateRepository`, calls `findAll()` and `getProgress()` in parallel via `Promise.all`, returns `{ dates, progress }`. The Astro page instantiates `SupabaseDateRepository` in frontmatter and passes it to the use case — keeping the page thin.

`DateCard.astro` uses semantic `<article>` elements with `data-date-id`, `data-completed`, and `data-category` attributes for future scratch-off (change #6) and Polaroid flip (change #7) enhancement without markup changes.

Grid uses CSS Grid with `repeat(auto-fill, minmax(220px, 1fr))` and responsive column counts via existing breakpoint mixins (2→3→4→5 columns).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/core/use-cases/GetDashboardData.ts` | New | Use case: fetch dates + progress |
| `src/core/use-cases/index.ts` | Modified | Export new use case |
| `src/presentation/components/ProgressBar.astro` | New | Animated progress bar component |
| `src/presentation/components/DateCard.astro` | New | Date card with 3 visual states |
| `src/presentation/pages/index.astro` | Modified | Complete rewrite: SSR dashboard |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Supabase unavailable at SSR → blank page | Low | Wrap in try/catch, render error state with retry |
| `TOGETHER_SINCE` env var missing | Med | Fallback to hardcoded default, validate in `astro.config.mjs` |
| 100-card grid performance on mobile | Low | CSS Grid with lazy rendering; no heavy JS per card |
| Card markup blocks future interactions | Low | Semantic `<article>` + data attributes; no inline event handlers |

## Rollback Plan

Revert `index.astro` to placeholder. Delete `GetDashboardData.ts`, `ProgressBar.astro`, `DateCard.astro`. Remove export from `use-cases/index.ts`. No DB or infra changes to revert.

## Dependencies

- `SupabaseDateRepository` (completed in `supabase-db` change)
- `TimeCounter.astro` (already exists)
- `TOGETHER_SINCE` environment variable

## Success Criteria

- [ ] Dashboard renders 100 date cards from Supabase in correct order
- [ ] Progress bar shows accurate completed/total count
- [ ] TimeCounter displays live elapsed time
- [ ] Grid is responsive across mobile/tablet/desktop
- [ ] Logout button works via existing `/api/auth/logout`
- [ ] `bun run build` passes with zero errors
- [ ] Card markup is compatible with future scratch-off and Polaroid changes
