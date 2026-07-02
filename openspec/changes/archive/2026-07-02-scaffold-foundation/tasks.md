# Tasks: Scaffold Foundation

## Review Workload Forecast

| Field                   | Value                                                       |
| ----------------------- | ----------------------------------------------------------- |
| Estimated changed lines | ~180 (17 new files, 3 modified, 1 deleted)                  |
| 400-line budget risk    | Medium                                                      |
| Chained PRs recommended | Yes                                                         |
| Suggested split         | PR 1 (tooling) → PR 2 (entities) → PR 3 (astro + migration) |
| Delivery strategy       | force-chained                                               |
| Chain strategy          | pending                                                     |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal                                                         | Likely PR | Notes                                                           |
| ---- | ------------------------------------------------------------ | --------- | --------------------------------------------------------------- |
| 1    | Install deps + configure vitest, prettier, tsconfig, scripts | PR 1      | Base branch; verifies `bun run test` and `bun run format:check` |
| 2    | Create CA directories + entity interfaces + barrel exports   | PR 2      | Depends on PR 1; verifies `bun run typecheck`                   |
| 3    | Configure Astro adapter + SCSS + BaseLayout + migrate pages  | PR 3      | Depends on PR 2; verifies `bun run build`                       |

## Phase 1: Dependencies & Tooling

- [x] 1.1 Install production deps: `bun add @astrojs/netlify sass`
- [x] 1.2 Install dev deps: `bun add -d vitest prettier prettier-plugin-astro @types/node`
- [x] 1.3 Create `vitest.config.ts` — use `getViteConfig()` from `astro/config`, include `src/**/*.test.ts`
- [x] 1.4 Create `.prettierrc` — semi, singleQuote, trailingComma "all", printWidth 100, plugins: `["prettier-plugin-astro"]`, override `*.astro` parser
- [x] 1.5 Create `.prettierignore` — dist, node_modules, .astro, .netlify
- [x] 1.6 Update `tsconfig.json` — add `baseUrl: "."`, `paths` (`@core/*`, `@infrastructure/*`, `@presentation/*`), `types: ["vitest/globals"]`
- [x] 1.7 Add scripts to `package.json` — `test`, `test:watch`, `format`, `format:check`, `typecheck`

**Verify**: `bun run test` exits 0 (empty suite). `bun run format:check` exits 0.

## Phase 2: Directory Structure & Entities

- [x] 2.1 Create directories: `src/core/entities/`, `src/core/use-cases/`, `src/infrastructure/repositories/`, `src/infrastructure/services/`, `src/presentation/pages/api/`, `src/presentation/layouts/`, `src/presentation/components/`, `src/presentation/styles/`
- [x] 2.2 Create `src/core/entities/User.ts` — `export interface User { id: string; username: string; createdAt: Date }`
- [x] 2.3 Create `src/core/entities/DateEntry.ts` — `export interface DateEntry { id, title, description?, category: 'predefined'|'free', completed, completedAt?, memories: Memory[] }`
- [x] 2.4 Create `src/core/entities/Memory.ts` — `export interface Memory { id, dateId, imageUrl, note?, location?, createdAt: Date }`
- [x] 2.5 Create `src/core/entities/index.ts` — barrel: `export type { User } from './User'`, `export type { DateEntry } from './DateEntry'`, `export type { Memory } from './Memory'`
- [x] 2.6 Create empty barrel exports: `src/core/use-cases/index.ts`, `src/infrastructure/repositories/index.ts`, `src/infrastructure/services/index.ts` (each: `export {}`)
- [x] 2.7 Create `.gitkeep` in `src/presentation/components/` and `src/presentation/pages/api/`

**Verify**: `bun run typecheck` exits 0. All 8+ directories exist.

## Phase 3: Astro Config, Styles & Migration

- [x] 3.1 Update `astro.config.mjs` — `import netlify from '@astrojs/netlify'`, set `adapter: netlify()`, set `srcDir: './src/presentation'`. **Do NOT set `output`** (design override: `hybrid` removed in Astro 5+).
- [x] 3.2 Create `src/presentation/styles/_variables.scss` — placeholder color, spacing, font tokens
- [x] 3.3 Create `src/presentation/styles/_mixins.scss` — responsive breakpoint mixins
- [x] 3.4 Create `src/presentation/styles/global.scss` — CSS reset + base styles, `@use 'variables'`
- [x] 3.5 Create `src/presentation/layouts/BaseLayout.astro` — minimal HTML5 shell, `<slot />`, import `global.scss`
- [x] 3.6 Copy `src/pages/index.astro` → `src/presentation/pages/index.astro`
- [x] 3.7 Delete `src/pages/` directory entirely

**Verify**: `bun run build` exits 0. `bun run dev` serves page from `src/presentation/pages/`.

## Phase 4: Final Verification

- [x] 4.1 Run `bun run typecheck` — exits 0
- [x] 4.2 Run `bun run test` — exits 0
- [x] 4.3 Run `bun run format` — reformats all files
- [x] 4.4 Run `bun run format:check` — exits 0
- [x] 4.5 Run `bun run build` — exits 0, Netlify adapter active
