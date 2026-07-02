# Tasks: Authentication System

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~450 (19 files, ~350 additions + ~100 deletions/replacements) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (Core + Infra) → PR 2 (API + Middleware) → PR 3 (Presentation + Config) |
| Delivery strategy | force-chained |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Core ports + infrastructure services + use cases | PR 1 | ~150 lines; standalone domain layer, typechecks independently |
| 2 | API endpoints + middleware + types | PR 2 | ~80 lines; depends on PR 1; wires auth into HTTP layer |
| 3 | Login page + TimeCounter + index.astro + config + .env | PR 3 | ~220 lines; depends on PR 2; UI + config, final verification |

## Phase 1: Configuration & Dependencies

- [ ] 1.1 Install `jose`: run `bun add jose` in project root
- [ ] 1.2 Create `.env.example` at project root with placeholders: `JWT_SECRET`, `TOGETHER_SINCE`, `HER_USERNAME`, `HER_PASSWORD`, `HIS_USERNAME`, `HIS_PASSWORD`
- [ ] 1.3 Verify `.env` is listed in `.gitignore`; add it if missing
- [ ] 1.4 Modify `astro.config.mjs`: add env schema validation via `env.validateSecrets` or `experimental.env` — ensure `JWT_SECRET` is required at startup

**Verify**: `bun install` succeeds, `.env.example` exists, `bun run typecheck` passes.

## Phase 2: Core Ports (Interfaces)

- [ ] 2.1 Create `src/core/ports/CredentialsVerifier.ts` — interface with `verify(username: string, password: string): string`
- [ ] 2.2 Create `src/core/ports/TokenService.ts` — interface with `sign(payload: { sub: string }): Promise<string>` and `verify(token: string): Promise<{ sub: string }>`
- [ ] 2.3 Create `src/core/ports/index.ts` — barrel export both ports

**Verify**: `bun run typecheck` passes with zero errors.

## Phase 3: Infrastructure Services

- [ ] 3.1 Create `src/infrastructure/services/JwtService.ts` — implements `TokenService` using `jose` (`SignJWT`, `jwtVerify`), HS256 algorithm, 7-day expiry, `TextEncoder` for secret
- [ ] 3.2 Create `src/infrastructure/services/EnvCredentialsVerifier.ts` — implements `CredentialsVerifier`, reads `HER_*`/`HIS_*` from env, case-insensitive username match, `timingSafeEqual` from `node:crypto` for password, returns canonical username
- [ ] 3.3 Modify `src/infrastructure/services/index.ts` — export `JwtService` and `EnvCredentialsVerifier`

**Verify**: `bun run typecheck` passes. Both services import cleanly from barrel.

## Phase 4: Core Use Cases

- [ ] 4.1 Create `src/core/use-cases/AuthenticateUser.ts` — constructor takes `CredentialsVerifier` + `TokenService`, `execute(username, password)` calls verify then sign, returns JWT string
- [ ] 4.2 Create `src/core/use-cases/VerifySession.ts` — constructor takes `TokenService`, `execute(token)` delegates to `tokenService.verify(token)`, returns `{ sub }`
- [ ] 4.3 Modify `src/core/use-cases/index.ts` — export `AuthenticateUser` and `VerifySession`

**Verify**: `bun run typecheck` passes. Use cases depend only on port interfaces, not infrastructure.

## Phase 5: Presentation Types

- [ ] 5.1 Create `src/presentation/env.d.ts` — extend `App.Locals` with `user?: { sub: string }`

**Verify**: `bun run typecheck` passes. `Astro.locals.user` is typed in `.astro` files.

## Phase 6: API Endpoints

- [ ] 6.1 Create `src/presentation/pages/api/auth/login.ts` — POST handler: parse `{ username, password }` from body, validate non-empty (400 if missing), instantiate `JwtService` + `EnvCredentialsVerifier` + `AuthenticateUser`, call `execute()`, set `auth_token` cookie (httpOnly, secure in prod, sameSite strict, path `/`, maxAge 604800), return `{ success: true }`. Catch errors → 401 `{ error: "Credenciales inválidas" }`
- [ ] 6.2 Create `src/presentation/pages/api/auth/logout.ts` — POST handler: clear `auth_token` cookie (same options), return `{ success: true }`. Idempotent — always succeeds

**Verify**: `bun run typecheck` passes. Both files export `POST` API handler per Astro convention.

## Phase 7: Middleware

- [ ] 7.1 Create `src/presentation/middleware.ts` — define `onRequest` middleware. Public route whitelist: `/login`, `/api/auth/login`, `/api/auth/logout`. For protected routes: read `auth_token` cookie, instantiate `JwtService` + `VerifySession`, call `execute(token)`. On success: set `context.locals.user = { sub }`, call `next()`. On failure/missing: redirect to `/login`

**Verify**: `bun run typecheck` passes. Middleware is at `src/presentation/middleware.ts` (Astro resolves from `srcDir`).

## Phase 8: Login Page + TimeCounter

- [ ] 8.1 Create `src/presentation/components/TimeCounter.astro` — Astro island with `client:load`. Props: `togetherSince: string`. Client script: precise UTC date diff algorithm (year/month/day/hour/minute/second with borrow cascade). Renders "X años, Y meses, Z días, H horas, M minutos, S segundos". `setInterval` updates every 1000ms. Future date → all zeros
- [ ] 8.2 Create `src/presentation/pages/login.astro` — `export const prerender = false`. Uses `BaseLayout`. Renders login form (username + password inputs, submit button) and `<TimeCounter client:load togetherSince={import.meta.env.TOGETHER_SINCE} />`. Client script: `fetch('/api/auth/login', { method: 'POST', body: JSON.stringify(...) })`. On success → `window.location.href = '/'`. On error → display error message

**Verify**: `bun run typecheck` passes. Login page has `prerender = false`.

## Phase 9: Dashboard Placeholder

- [ ] 9.1 Modify `src/presentation/pages/index.astro` — add `export const prerender = false` in frontmatter, replace inline HTML with `BaseLayout` import, add placeholder content (e.g. "Dashboard" heading + logout button that POSTs to `/api/auth/logout`)

**Verify**: `bun run typecheck` passes. Page uses `BaseLayout`.

## Phase 10: Final Verification

- [ ] 10.1 Run `bun run typecheck` — must pass with zero errors
- [ ] 10.2 Run `bun run build` — must complete successfully
- [ ] 10.3 Manual check: all new files exist at expected paths, no orphan imports
