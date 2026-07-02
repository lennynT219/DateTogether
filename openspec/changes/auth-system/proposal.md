# Proposal: Authentication System

## Intent

DatesTogether is a private app for two users (him and her). There is no public signup — credentials come from environment variables. We need JWT-based authentication with HTTP-only cookies, a minimalist login page featuring a live "Tiempo juntos" counter, and Astro middleware to guard protected routes.

## Scope

### In Scope

- Two-user credential auth via env vars (`HER_USERNAME`, `HER_PASSWORD`, `HIS_USERNAME`, `HIS_PASSWORD`)
- JWT sign/verify using `jose` library (HS256, 7-day expiry)
- HTTP-only cookie (`auth_token`, secure, sameSite strict, path `/`)
- `AuthenticateUser` and `VerifySession` use cases in core with port interfaces
- `JwtService` and `EnvCredentialsVerifier` infrastructure implementations
- Astro global middleware at `src/presentation/middleware.ts` protecting all routes except `/login` and `/api/auth/login`
- Login page (`/login`) with "Tiempo juntos" Astro Island counter (`client:load`, updates every second)
- POST `/api/auth/login` and POST `/api/auth/logout` API endpoints
- `TOGETHER_SINCE` env var for counter start date

### Out of Scope

- Database / Supabase integration (next change)
- Registration or public signup
- Password hashing (plaintext env comparison acceptable for 2-user private app)
- CSRF protection (deferred until state-changing forms exist beyond login)
- Dashboard page content (next change; `/` will redirect here after login)
- Token refresh mechanism

## Capabilities

### New Capabilities

- `auth`: JWT-based two-user authentication with credential verification, session management, login/logout flows, and route protection middleware

### Modified Capabilities

None

## Approach

Clean Architecture with strict dependency direction:

- **Core**: `AuthenticateUser` use case depends on `CredentialsVerifier` and `TokenService` ports (interfaces). `VerifySession` depends on `TokenService` only.
- **Infrastructure**: `EnvCredentialsVerifier` reads env vars and compares with `crypto.timingSafeEqual`. `JwtService` uses `jose` for sign/verify.
- **Presentation**: Astro middleware reads `auth_token` cookie, verifies via `VerifySession`, populates `Astro.locals.user`. Login page posts to API endpoint which calls `AuthenticateUser` and sets cookie on success.

Counter island: `TimeCounter.astro` receives `togetherSince` prop from server, hydrates with `client:load`, calculates and renders elapsed time updating every second via `setInterval`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/core/entities/User.ts` | Modified | Add optional `role` field (him/her) |
| `src/core/use-cases/AuthenticateUser.ts` | New | Validates credentials, returns JWT |
| `src/core/use-cases/VerifySession.ts` | New | Validates JWT from cookie |
| `src/core/ports/CredentialsVerifier.ts` | New | Port interface |
| `src/core/ports/TokenService.ts` | New | Port interface |
| `src/infrastructure/services/JwtService.ts` | New | `jose` implementation |
| `src/infrastructure/services/EnvCredentialsVerifier.ts` | New | Env var implementation |
| `src/presentation/middleware.ts` | New | Global auth guard |
| `src/presentation/pages/login.astro` | New | Login page with counter |
| `src/presentation/pages/api/auth/login.ts` | New | POST login endpoint |
| `src/presentation/pages/api/auth/logout.ts` | New | POST logout endpoint |
| `src/presentation/components/TimeCounter.astro` | New | Client-side counter island |
| `astro.config.mjs` | Modified | Add env schema for secrets |
| `package.json` | Modified | Add `jose` dependency |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Static page leakage: protected pages pre-rendered without auth | Med | Every private page MUST set `prerender = false`; consider `output: 'server'` later |
| Plaintext passwords in env vars | Low | Acceptable for 2-user private app; restrict Netlify env access |
| JWT secret rotation invalidates all sessions | Low | Acceptable for 2 users; document in deployment guide |
| Middleware file location silently disables guard | Med | Must be `src/presentation/middleware.ts` (Astro resolves from `srcDir`) |

## Rollback Plan

Remove `jose` dependency, delete all new auth files, remove middleware, revert `astro.config.mjs` env schema changes. No database migrations to reverse.

## Dependencies

- `jose` (JWT library, Web Crypto based, Edge-compatible)

## Success Criteria

- [ ] Two users can log in with env-var credentials and receive a JWT cookie
- [ ] Protected routes redirect unauthenticated users to `/login`
- [ ] Login page displays live "Tiempo juntos" counter updating every second
- [ ] Logout clears the cookie and redirects to `/login`
- [ ] `tsc --noEmit` passes with zero errors
- [ ] `bun run build` completes successfully
