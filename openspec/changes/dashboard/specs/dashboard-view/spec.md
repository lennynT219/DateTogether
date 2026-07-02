# dashboard-view Specification

## Purpose

Dashboard page displaying the 100-date grid, progress tracker, and relationship time counter. Server-side data orchestration via `GetDashboardData` use case.

## Requirements

### REQ-DASH-001: GetDashboardData Use Case

The system SHALL provide a `GetDashboardData` use case that injects `DateRepository`, calls `findAll()` and `getProgress()` in parallel, and returns `{ dates: DateEntry[]; progress: { completed: number; total: number } }`. Dates MUST be ordered by `orderIndex` ascending. On repository error, the use case SHALL return empty dates and zero progress.

#### Scenario: Successful fetch with 100 dates

- GIVEN a repository with 100 dates (30 completed)
- WHEN `execute()` is called
- THEN returns `{ dates: DateEntry[100], progress: { completed: 30, total: 100 } }`
- AND dates are ordered by `orderIndex` ascending

#### Scenario: Fetch with some completed

- GIVEN a repository with 100 dates (50 completed)
- WHEN `execute()` is called
- THEN `progress.completed` equals 50 and `progress.total` equals 100

#### Scenario: Repository error returns empty

- GIVEN a repository that throws on `findAll()`
- WHEN `execute()` is called
- THEN returns `{ dates: [], progress: { completed: 0, total: 0 } }`

#### Scenario: Dates ordered correctly

- GIVEN dates with orderIndex values [3, 1, 2]
- WHEN `execute()` is called
- THEN returned dates are ordered [1, 2, 3]

### REQ-DASH-002: ProgressBar Component

The system SHALL provide a `ProgressBar` component accepting `{ completed: number; total: number }`. It MUST render a container bar with a fill element (width = completed/total x 100%) and display text "X / 100". Fill color SHALL be `#8B6F47`. Fill MUST animate from 0 to target width on mount via CSS transition. When `total` is 0, display 0%.

#### Scenario: 50 of 100 completed

- GIVEN `completed=50, total=100`
- WHEN component renders
- THEN fill width is 50% and text shows "50 / 100"

#### Scenario: 0 completed

- GIVEN `completed=0, total=100`
- WHEN component renders
- THEN fill width is 0% and text shows "0 / 100"

#### Scenario: 100 completed

- GIVEN `completed=100, total=100`
- WHEN component renders
- THEN fill width is 100% and text shows "100 / 100"

#### Scenario: Total is 0 edge case

- GIVEN `completed=0, total=0`
- WHEN component renders
- THEN fill width is 0% and text shows "0 / 100"

### REQ-DASH-003: DateCard Component

The system SHALL provide a `DateCard` component accepting a `DateEntry`. It MUST render a semantic `<article>` with `data-date-id`, `data-completed`, and `data-category` attributes. Card MUST maintain 3:4 aspect ratio. Styles MUST be SCSS scoped, coffee/beige palette.

| State | Category | Badge | Content |
|-------|----------|-------|---------|
| Incomplete | predefined | "Pendiente" | Title + lock icon (inline SVG) |
| Incomplete | free | "Pendiente" | "Espacio libre" + lock icon |
| Completed | any | "Completada" | Photo placeholder (gray box + heart icon) |

#### Scenario: Incomplete predefined renders title

- GIVEN a DateEntry with `category='predefined'`, `completed=false`, `title='Sunset walk'`
- WHEN rendered
- THEN shows title "Sunset walk", "Pendiente" badge, lock icon, and `data-completed="false"`

#### Scenario: Incomplete free renders "Espacio libre"

- GIVEN a DateEntry with `category='free'`, `completed=false`
- WHEN rendered
- THEN shows "Espacio libre", "Pendiente" badge, lock icon

#### Scenario: Completed renders badge and placeholder

- GIVEN a DateEntry with `completed=true`
- WHEN rendered
- THEN shows "Completada" badge and photo placeholder with heart icon

#### Scenario: All cards have data attributes

- GIVEN any DateEntry with `id='abc'`, `category='predefined'`, `completed=false`
- WHEN rendered
- THEN `<article>` has `data-date-id="abc"`, `data-completed="false"`, `data-category="predefined"`

### REQ-DASH-004: Dashboard Page

The system SHALL rewrite `index.astro` as an SSR page (`export const prerender = false`). The frontmatter MUST instantiate `SupabaseDateRepository` and `GetDashboardData`, fetch data server-side, and pass results to components. On fetch failure, the page MUST render an empty grid with message "No se pudieron cargar las citas".

#### Scenario: Renders with 100 dates

- GIVEN Supabase returns 100 dates
- WHEN the page loads
- THEN renders header + grid of 100 DateCards

#### Scenario: Renders with 0 dates (error)

- GIVEN Supabase is unreachable
- WHEN the page loads
- THEN renders "No se pudieron cargar las citas"

#### Scenario: Shows TimeCounter and ProgressBar

- GIVEN dashboard loads successfully with progress 30/100
- WHEN the page renders
- THEN header contains TimeCounter and ProgressBar showing "30 / 100"

#### Scenario: Logout button present

- GIVEN dashboard loads successfully
- WHEN the page renders
- THEN a logout button is present in the header

### REQ-DASH-005: Grid Layout

The dashboard grid MUST use CSS Grid with `repeat(auto-fill, minmax(220px, 1fr))` and `gap: 1.5rem`. Responsive columns: 1 col (<480px), 2 cols (480-768px), 3 cols (768-1024px), 4-5 cols (>1024px).

#### Scenario: Grid renders 100 cards

- GIVEN 100 dates loaded
- WHEN the grid renders
- THEN all 100 DateCards are present in the grid

#### Scenario: Responsive breakpoints apply

- GIVEN viewport is 800px wide (tablet)
- WHEN the grid renders
- THEN displays 3 columns

#### Scenario: Gap consistent

- GIVEN any viewport
- WHEN the grid renders
- THEN gap between cards is 1.5rem

### REQ-DASH-006: Dashboard Header

The header MUST contain `TimeCounter` (`client:load`), `ProgressBar`, and a logout button. Logout SHALL POST to `/api/auth/logout` then redirect to `/login`.

#### Scenario: Header renders all 3 elements

- GIVEN dashboard loads successfully
- WHEN the page renders
- THEN header contains TimeCounter, ProgressBar, and logout button

#### Scenario: Logout works

- GIVEN user clicks logout button
- WHEN POST `/api/auth/logout` succeeds
- THEN browser redirects to `/login`

#### Scenario: TimeCounter updates every second

- GIVEN dashboard is loaded
- WHEN 2 seconds elapse
- THEN TimeCounter values have incremented
