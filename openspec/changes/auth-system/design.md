# Design: Authentication System

## Technical Approach

JWT-based auth following Clean Architecture from the proposal. Core defines ports (`CredentialsVerifier`, `TokenService`) and use cases (`AuthenticateUser`, `VerifySession`). Infrastructure implements ports with `jose` and env vars. Presentation wires everything via Astro middleware, API routes, and a login page with a live counter island.

## Architecture Decisions

| Decision | Option A | Option B | Choice | Rationale |
|----------|----------|----------|--------|-----------|
| JWT library | `jose` | `jsonwebtoken` | `jose` | Web Crypto, ESM-first, Edge-compatible, no native deps |
| Credential comparison | `crypto.timingSafeEqual` | `===` | `timingSafeEqual` | Prevents timing attacks even for 2-user app |
| Env access | `import.meta.env` with schema | `astro:env/server` | `import.meta.env` + env schema validation | Simpler access pattern; schema validates at startup |
| Route protection | Global middleware | Per-page checks | Global middleware | Single place to protect routes, populates `locals.user` |
| Cookie transport | HTTP-only cookie | `localStorage` | HTTP-only cookie | XSS-resistant, Astro has first-class `context.cookies` API |
| Login form submission | Client-side `fetch` | Standard form POST | Client-side `fetch` | API returns JSON; need to handle response without full page reload |
| TimeCounter algorithm | Approximate (365.25/30.44) | Precise UTC Date diff | Precise UTC diff | Handles variable month lengths and leap years correctly |
| CredentialsVerifier return | `boolean` | `string` (username) | `string` | Spec REQ-AUTH-002: "return username"; provides canonical case-insensitive match |

## Data Flow

```
Login Flow:
  Browser ──POST {username,password}──→ /api/auth/login
    └→ AuthenticateUser.execute(user, pass)
         ├→ CredentialsVerifier.verify(user, pass) → canonical username
         └→ TokenService.sign({ sub: username }) → JWT
    └→ Set-Cookie(auth_token=JWT) → 302 redirect /

Protected Route Flow:
  Browser ──GET /──→ Middleware (src/presentation/middleware.ts)
    └→ read auth_token cookie
    └→ VerifySession.execute(token) → TokenService.verify(token) → { sub }
    └→ context.locals.user = { sub } → next() → Page renders

Logout Flow:
  Browser ──POST──→ /api/auth/logout
    └→ clear auth_token cookie → { success: true }
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/core/ports/CredentialsVerifier.ts` | Create | Port interface: `verify(user, pass): string` |
| `src/core/ports/TokenService.ts` | Create | Port interface: `sign` / `verify` |
| `src/core/ports/index.ts` | Create | Barrel export for ports |
| `src/core/use-cases/AuthenticateUser.ts` | Create | Orchestrates verify + sign, returns JWT |
| `src/core/use-cases/VerifySession.ts` | Create | Verifies token, returns `{ sub }` |
| `src/core/use-cases/index.ts` | Modify | Add auth use-case exports |
| `src/infrastructure/services/JwtService.ts` | Create | `jose` HS256, 7-day expiry implementation |
| `src/infrastructure/services/EnvCredentialsVerifier.ts` | Create | Env var comparison with `timingSafeEqual` |
| `src/infrastructure/services/index.ts` | Modify | Add service exports |
| `src/presentation/middleware.ts` | Create | Global auth guard with public route whitelist |
| `src/presentation/pages/login.astro` | Create | SSR login page with counter + form |
| `src/presentation/pages/api/auth/login.ts` | Create | POST login endpoint |
| `src/presentation/pages/api/auth/logout.ts` | Create | POST logout endpoint |
| `src/presentation/components/TimeCounter.astro` | Create | Client-side counter island (`client:load`) |
| `src/presentation/env.d.ts` | Create | `App.Locals` type extension for `user` |
| `src/presentation/pages/index.astro` | Modify | Add `prerender = false`, use BaseLayout |
| `astro.config.mjs` | Modify | Add env schema for secrets |
| `package.json` | Modify | Add `jose` dependency |
| `.env.example` | Create | Template with placeholder values |

## Interfaces / Contracts

### Core Ports

```typescript
// src/core/ports/CredentialsVerifier.ts
export interface CredentialsVerifier {
  verify(username: string, password: string): string; // returns canonical username
}

// src/core/ports/TokenService.ts
export interface TokenService {
  sign(payload: { sub: string }): Promise<string>;
  verify(token: string): Promise<{ sub: string }>;
}
```

### Use Cases

```typescript
// src/core/use-cases/AuthenticateUser.ts
export class AuthenticateUser {
  constructor(
    private credentialsVerifier: CredentialsVerifier,
    private tokenService: TokenService
  ) {}
  async execute(username: string, password: string): Promise<string> {
    const canonicalUser = this.credentialsVerifier.verify(username, password);
    return this.tokenService.sign({ sub: canonicalUser });
  }
}

// src/core/use-cases/VerifySession.ts
export class VerifySession {
  constructor(private tokenService: TokenService) {}
  async execute(token: string): Promise<{ sub: string }> {
    return this.tokenService.verify(token);
  }
}
```

### JwtService (jose API)

```typescript
// src/infrastructure/services/JwtService.ts
import { SignJWT, jwtVerify } from 'jose';

export class JwtService implements TokenService {
  private secret: Uint8Array;
  constructor(secret: string) {
    this.secret = new TextEncoder().encode(secret);
  }
  async sign(payload: { sub: string }): Promise<string> {
    return new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(this.secret);
  }
  async verify(token: string): Promise<{ sub: string }> {
    const { payload } = await jwtVerify(token, this.secret, { algorithms: ['HS256'] });
    return { sub: payload.sub as string };
  }
}
```

### EnvCredentialsVerifier (timingSafeEqual)

```typescript
// src/infrastructure/services/EnvCredentialsVerifier.ts
import { timingSafeEqual } from 'crypto';

export class EnvCredentialsVerifier implements CredentialsVerifier {
  private users: Array<{ username: string; password: string }>;
  constructor(env: { HER_USERNAME: string; HER_PASSWORD: string; HIS_USERNAME: string; HIS_PASSWORD: string }) {
    this.users = [
      { username: env.HER_USERNAME, password: env.HER_PASSWORD },
      { username: env.HIS_USERNAME, password: env.HIS_PASSWORD },
    ];
  }
  verify(username: string, password: string): string {
    const match = this.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!match) throw new Error('Invalid credentials');
    const a = Buffer.from(match.password);
    const b = Buffer.from(password);
    if (a.length !== b.length || !timingSafeEqual(a, b)) throw new Error('Invalid credentials');
    return match.username;
  }
}
```

### TimeCounter Algorithm (non-obvious — precise UTC diff)

```javascript
function getTimeTogether(since) {
  const now = new Date();
  const start = new Date(since);
  let years = now.getUTCFullYear() - start.getUTCFullYear();
  let months = now.getUTCMonth() - start.getUTCMonth();
  let days = now.getUTCDate() - start.getUTCDate();
  let hours = now.getUTCHours() - start.getUTCHours();
  let minutes = now.getUTCMinutes() - start.getUTCMinutes();
  let seconds = now.getUTCSeconds() - start.getUTCSeconds();
  if (seconds < 0) { seconds += 60; minutes--; }
  if (minutes < 0) { minutes += 60; hours--; }
  if (hours < 0) { hours += 24; days--; }
  if (days < 0) {
    const prevMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0));
    days += prevMonth.getUTCDate();
    months--;
  }
  if (months < 0) { months += 12; years--; }
  if (years < 0) return { years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  return { years, months, days, hours, minutes, seconds };
}
```

### Cookie Configuration

| Property | Value |
|----------|-------|
| name | `auth_token` |
| httpOnly | `true` |
| secure | `import.meta.env.PROD` |
| sameSite | `'strict'` |
| path | `'/'` |
| maxAge | `604800` (7 days) |

### API Contracts

**POST /api/auth/login**: Body `{ username, password }` → 200 `{ success: true }` + Set-Cookie | 401 `{ error: "Credenciales inválidas" }` | 400 `{ error: "Usuario y contraseña son requeridos" }`

**POST /api/auth/logout**: → 200 `{ success: true }` + clear cookie (always succeeds, idempotent)

### Dependency Injection (no container — factory at endpoint level)

```typescript
// In API routes:
const jwtService = new JwtService(import.meta.env.JWT_SECRET);
const credentialsVerifier = new EnvCredentialsVerifier(import.meta.env);
const authenticateUser = new AuthenticateUser(credentialsVerifier, jwtService);
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Type check | All files compile | `tsc --noEmit` (existing `typecheck` script) |
| Build | Full Astro build succeeds | `bun run build` (existing `build` script) |
| Unit | JwtService sign/verify, EnvCredentialsVerifier, use cases | Manual verification (no test runner configured yet) |
| E2E | Login flow, protected route redirect, counter | Manual browser testing |

## Migration / Rollout

No migration required. New feature with no existing data or users.

**Rollback**: Remove `jose` dependency, delete all new auth files (`src/core/ports/`, new use-cases, new services, middleware, login page, API routes, TimeCounter), revert `astro.config.mjs` env schema changes, revert `index.astro` changes.

## Open Questions

- [ ] Consider switching to `output: 'server'` globally instead of per-page `prerender = false` as more protected pages are added (deferred — current approach works for initial scope).
