# Design: Scaffold Foundation

## Technical Approach

Scaffold the Clean Architecture foundation for DatesTogether: layered directory structure, Netlify adapter for SSR-capable pages, Vitest test runner, Prettier formatter, and SCSS support. All tooling targets Astro 7 with TypeScript strict mode.

**Critical correction from proposal/specs**: `output: 'hybrid'` was removed in Astro 5.0. The default `output: 'static'` now includes per-page SSR opt-out via `export const prerender = false`. No `output` property is needed in the config.

## Architecture Decisions

| Decision               | Options                                            | Tradeoff                                                                                                | Choice                                             |
| ---------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| SSR mode               | `output: 'hybrid'` vs default `static`             | hybrid removed in Astro 5; `static` + per-page `prerender = false` is the replacement                   | **Default `static`** — no `output` property needed |
| Vitest integration     | `@astrojs/vitest` vs `getViteConfig()`             | `@astrojs/vitest` does not exist on npm; `getViteConfig()` from `astro/config` is the official approach | **`getViteConfig()`**                              |
| Netlify adapter import | `@astrojs/netlify` vs `@astrojs/netlify/functions` | Default import handles both static and SSR; `/functions` is for explicit function-per-route             | **Default import** `@astrojs/netlify`              |
| Entity field naming    | `Date` interface vs `DateEntry`                    | `Date` shadows JS built-in `Date`; causes import confusion                                              | **`DateEntry`** for the domain entity              |
| SCSS architecture      | Global partials vs CSS modules only                | Global partials (`_variables.scss`) needed for shared design tokens; modules for component isolation    | **Both** — global partials + module support        |

## Directory Structure

```
src/
├── core/
│   ├── entities/
│   │   ├── User.ts
│   │   ├── DateEntry.ts
│   │   ├── Memory.ts
│   │   └── index.ts          ← barrel export
│   └── use-cases/
│       └── index.ts          ← barrel export (empty)
├── infrastructure/
│   ├── repositories/
│   │   └── index.ts          ← barrel export (empty)
│   └── services/
│       └── index.ts          ← barrel export (empty)
└── presentation/
    ├── pages/
    │   ├── index.astro       ← migrated from src/pages/
    │   └── api/              ← directory only (for future API routes)
    ├── layouts/
    │   └── BaseLayout.astro
    ├── components/
    │   └── .gitkeep
    └── styles/
        ├── global.scss
        ├── _variables.scss
        └── _mixins.scss
```

## Data Flow

No runtime data flow for this scaffold. The directory structure establishes the dependency direction:

```
presentation ──→ core ←── infrastructure
(pages/api)    (entities)   (repos/services)
     │              ↑              │
     └──────────────┴──────────────┘
         depends on interfaces
```

## Interfaces / Contracts

```typescript
// src/core/entities/User.ts
export interface User {
  id: string;
  username: string;
  createdAt: Date;
}

// src/core/entities/DateEntry.ts
export interface DateEntry {
  id: string;
  title: string;
  description?: string;
  category: 'predefined' | 'free';
  completed: boolean;
  completedAt?: Date;
  memories: Memory[];
}

// src/core/entities/Memory.ts
export interface Memory {
  id: string;
  dateId: string;
  imageUrl: string;
  note?: string;
  location?: string;
  createdAt: Date;
}
```

**Note**: `Date` renamed to `DateEntry` to avoid shadowing the JS `Date` built-in used in `createdAt`/`completedAt` fields. Entity fields are minimal and extensible — the 100-date PDF content will drive future field additions.

## File Changes

| File                                        | Action | Description                                             |
| ------------------------------------------- | ------ | ------------------------------------------------------- |
| `astro.config.mjs`                          | Modify | Add Netlify adapter, set `srcDir: './src/presentation'` |
| `package.json`                              | Modify | Add deps, devDeps, and scripts                          |
| `tsconfig.json`                             | Modify | Add path aliases and vitest types                       |
| `vitest.config.ts`                          | Create | Vitest config using `getViteConfig()`                   |
| `.prettierrc`                               | Create | Prettier config with Astro plugin                       |
| `.prettierignore`                           | Create | Ignore dist, node_modules, .astro                       |
| `src/core/entities/User.ts`                 | Create | User interface                                          |
| `src/core/entities/DateEntry.ts`            | Create | DateEntry interface                                     |
| `src/core/entities/Memory.ts`               | Create | Memory interface                                        |
| `src/core/entities/index.ts`                | Create | Barrel export                                           |
| `src/core/use-cases/index.ts`               | Create | Empty barrel export                                     |
| `src/infrastructure/repositories/index.ts`  | Create | Empty barrel export                                     |
| `src/infrastructure/services/index.ts`      | Create | Empty barrel export                                     |
| `src/presentation/pages/index.astro`        | Create | Migrated from `src/pages/index.astro`                   |
| `src/presentation/layouts/BaseLayout.astro` | Create | Minimal HTML shell layout                               |
| `src/presentation/styles/global.scss`       | Create | Global reset and base styles                            |
| `src/presentation/styles/_variables.scss`   | Create | Color/spacing/font tokens                               |
| `src/presentation/styles/_mixins.scss`      | Create | Responsive breakpoint mixins                            |
| `src/presentation/components/.gitkeep`      | Create | Preserve empty directory                                |
| `src/presentation/pages/api/.gitkeep`       | Create | Preserve empty directory                                |
| `src/pages/`                                | Delete | Migrated to `src/presentation/pages/`                   |

## Configuration Files (exact content)

### astro.config.mjs

```js
// @ts-check
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';

export default defineConfig({
  adapter: netlify(),
  srcDir: './src/presentation',
});
```

### vitest.config.ts

```ts
/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: {
    include: ['src/**/*.test.ts'],
  },
});
```

### tsconfig.json

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"],
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@core/*": ["src/core/*"],
      "@infrastructure/*": ["src/infrastructure/*"],
      "@presentation/*": ["src/presentation/*"]
    },
    "types": ["vitest/globals"]
  }
}
```

### .prettierrc

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "plugins": ["prettier-plugin-astro"],
  "overrides": [
    {
      "files": "*.astro",
      "options": {
        "parser": "astro"
      }
    }
  ]
}
```

### .prettierignore

```
dist
node_modules
.astro
.netlify
```

## Package Dependencies

| Package                 | Version  | Type    | Purpose                             |
| ----------------------- | -------- | ------- | ----------------------------------- |
| `@astrojs/netlify`      | ^8.1.0   | deps    | Netlify SSR adapter                 |
| `sass`                  | ^1.101.0 | deps    | SCSS compilation                    |
| `vitest`                | ^4.1.9   | devDeps | Test runner                         |
| `prettier`              | ^3.9.4   | devDeps | Code formatter                      |
| `prettier-plugin-astro` | ^0.14.1  | devDeps | Astro file formatting               |
| `@types/node`           | ^26.1.0  | devDeps | Node.js type definitions for vitest |

## NPM Scripts

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "astro": "astro",
    "test": "vitest run",
    "test:watch": "vitest",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "typecheck": "tsc --noEmit"
  }
}
```

## Testing Strategy

| Layer       | What to Test                                   | Approach                                  |
| ----------- | ---------------------------------------------- | ----------------------------------------- |
| Unit        | Entity interfaces compile and export correctly | `tsc --noEmit` via typecheck script       |
| Integration | Vitest discovers and runs test files           | Empty test suite passes with `vitest run` |
| E2E         | N/A                                            | Not applicable for scaffold               |

No feature tests needed — this is infrastructure scaffolding. Verification is: build passes, test runner starts, formatter validates.

## Migration / Rollout

1. Create all new directories and files
2. Move `src/pages/index.astro` → `src/presentation/pages/index.astro`
3. Delete `src/pages/` directory
4. Update config files (`astro.config.mjs`, `tsconfig.json`, `package.json`)
5. Run `bun install` to install new dependencies
6. Verify: `bun run build`, `bun run test`, `bun run format:check`

Rollback: single `git revert` — all changes in one commit.

## Open Questions

- [ ] Should `BaseLayout.astro` include the global SCSS import, or should each page import it? (Recommendation: BaseLayout imports it once)
- [ ] The proposal mentions `bun` as the package manager but `package.json` has no `packageManager` field. Should we add one? (Recommendation: skip for now, bun is used by convention)
