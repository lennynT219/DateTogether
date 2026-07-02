# Auth Specification

## Purpose

JWT two-user auth: credentials, sessions, login/logout, route protection, "Tiempo juntos" counter.

## Requirements

### REQ-AUTH-001: JWT Token Service

Sign tokens `{ sub: username }` with HS256 via `jose`, 7-day expiry. Verify returns payload or throws.

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Valid | Token signed correctly | Verified | Payload |
| Expired | Token past expiry | Verified | Error |
| Malformed | Invalid JWT string | Verified | Error |
| Wrong secret | Different signing secret | Verified | Error |

### REQ-AUTH-002: Credentials Verification

Compare username/password against `HER_*`/`HIS_*` env vars. Case-insensitive username. Return username or throw.

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Valid her | Correct HER credentials | Verified | Username |
| Valid his | Correct HIS credentials | Verified | Username |
| Wrong password | Valid user, wrong password | Verified | Error |
| Unknown user | No matching username | Verified | Error |
| Empty | Empty username/password | Verified | Error |

### REQ-AUTH-003: AuthenticateUser

Orchestrate credential verification + token generation. Return JWT or throw.

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Success | Valid credentials | Execute | JWT |
| Failure | Invalid credentials | Execute | Error |

### REQ-AUTH-004: VerifySession

Extract token from cookie, verify, return username.
| Scenario | Given | When | Then |
|----------|-------|------|------|
| Valid | Cookie with valid token | Execute | Username |
| Missing | Empty/absent cookie | Execute | Error |
| Expired | Expired token in cookie | Execute | Error |

### REQ-AUTH-005: Login API

POST `/api/auth/login` accepts `{ username, password }`. Success: `auth_token` HTTP-only cookie (secure, sameSite strict, path `/`), `{ success: true }`. Failure: 401 `{ error }`.

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Success | Valid credentials | POST | Cookie set, success |
| Bad creds | Invalid credentials | POST | 401 |
| Missing fields | Missing username/password | POST | 401 |

### REQ-AUTH-006: Logout API

POST `/api/auth/logout` clears `auth_token`, returns `{ success: true }`.

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Logged in | Valid cookie | POST | Cleared, success |
| Already out | No cookie | POST | Success (idempotent) |

### REQ-AUTH-007: Auth Middleware

`src/presentation/middleware.ts` protects all except `/login`, `/api/auth/login`, `/api/auth/logout`. No token → redirect `/login`.

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Authenticated | Valid cookie | Access `/` | Proceeds, `locals.user` |
| Unauthenticated | No token | Access `/` | Redirect `/login` |
| Public | No token | Access `/login` | Proceeds |

### REQ-AUTH-008: Login Page

`/login` renders inputs, submit, counter. POSTs to API. Error on failure, redirect on success.

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Render | Unauthenticated | Visit `/login` | Form + counter |
| Failed | Invalid credentials | Submit | Error displayed |
| Success | Valid credentials | Submit | Redirect to `/` |

### REQ-AUTH-009: TimeCounter Island

`client:load`, `togetherSince` prop. "X años, Y meses, Z días, H horas, M minutos, S segundos". Updates every second.

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Initial | Component mounts | Page loads | Time shown |
| Tick | Mounted | 1s passes | Seconds increment |
| Future | Date in future | Renders | Zero values |

### REQ-AUTH-010: Environment Variables

Load `JWT_SECRET`, `TOGETHER_SINCE`, `HER_USERNAME`, `HER_PASSWORD`, `HIS_USERNAME`, `HIS_PASSWORD` via `import.meta.env`. Missing `JWT_SECRET` fails startup.
| Scenario | Given | When | Then |
|----------|-------|------|------|
| All present | All vars set | Start | Auth operational |
| No JWT_SECRET | Unset | Start | Fails |
| No TOGETHER_SINCE | Unset | Start | Counter fallback |
