# Proposal: Scaffold Foundation

## Intent

The project is a bare Astro 7 install with no architecture, no SSR adapter, no tests, no formatter, and no styling tooling. This change scaffolds the foundational infrastructure needed to build DatesTogether: Clean Architecture directory layout, Netlify hybrid SSR, test runner, code formatter, and SCSS modules. Without this foundation, every subsequent feature change would lack structure and tooling.

## Scope

### In Scope

- Install and configure `@astrojs/netlify` with `output: 'hybrid'`
- Restructure `src/` into Clean Architecture layers: `core/`, `infrastructure/`, `presentation/`
- Set `srcDir: './src/presentation'` in `astro.config.mjs`
- Install and configure `vitest` + `@astrojs/vitest` for unit/integration testing
- Install and configure `prettier` + `prettier-plugin-astro` for formatting
- Install `sass` for SCSS module support
- Add npm scripts: `test`, `format`, `format:check`
- Update `tsconfig.json` path aliases for Clean Architecture layers

### Out of Scope

- ESLint or any linter (user explicitly declined)
- CI/CD pipeline configuration
- Supabase or Cloudinary integration (separate changes)
- Any feature implementation or business logic
- Component library or UI framework selection

## Capabilities

### New Capabilities

- `project-tooling`: Test runner, formatter, SCSS compilation, and dev/build scripts
- `clean-architecture`: Directory structure with `core/`, `infrastructure/`, `presentation/` layers and path aliases

### Modified Capabilities

None

## Approach

1. Install production deps: `@astrojs/netlify`, `sass`
2. Install dev deps: `vitest`, `@astrojs/vitest`, `prettier`, `prettier-plugin-astro`
3. Update `astro.config.mjs`: add Netlify adapter, set `output: 'hybrid'`, set `srcDir: './src/presentation'`
4. Create directory structure: `src/core/entities/`, `src/core/use-cases/`, `src/infrastructure/repositories/`, `src/infrastructure/services/`, `src/presentation/pages/`, `src/presentation/layouts/`, `src/presentation/components/`
5. Migrate existing `src/pages/` content to `src/presentation/pages/`
6. Add `.prettierrc` with Astro plugin config
7. Update `tsconfig.json` with path aliases (`@core/*`, `@infrastructure/*`, `@presentation/*`)
8. Add scripts to `package.json`: `test`, `format`, `format:check`
9. Verify: `bun run build` and `bun run test` pass

## Affected Areas

| Area                  | Impact   | Description                                |
| --------------------- | -------- | ------------------------------------------ |
| `astro.config.mjs`    | Modified | Add Netlify adapter, hybrid output, srcDir |
| `package.json`        | Modified | New deps and scripts                       |
| `tsconfig.json`       | Modified | Path aliases for architecture layers       |
| `src/core/`           | New      | Entities and use-cases directories         |
| `src/infrastructure/` | New      | Repositories and services directories      |
| `src/presentation/`   | New      | Pages, layouts, components directories     |
| `.prettierrc`         | New      | Prettier configuration                     |
| `src/pages/`          | Removed  | Migrated to `src/presentation/pages/`      |

## Risks

| Risk                                                 | Likelihood | Mitigation                                                       |
| ---------------------------------------------------- | ---------- | ---------------------------------------------------------------- |
| `@astrojs/netlify` version incompatible with Astro 7 | Med        | Pin to latest compatible version; verify with `bun run build`    |
| `srcDir` change breaks existing page routing         | Low        | Only one default page exists; migrate and verify routes manually |
| `@astrojs/vitest` not yet stable for Astro 7         | Low        | Fall back to plain `vitest` if integration package unavailable   |

## Rollback Plan

Revert all config changes (`astro.config.mjs`, `package.json`, `tsconfig.json`), remove new directories, restore `src/pages/` from git. Uninstall added packages with `bun remove`. Single commit makes `git revert` sufficient.

## Dependencies

- `@astrojs/netlify` — SSR adapter for Netlify Edge deployment
- `sass` — SCSS module compilation
- `vitest` — Test runner
- `@astrojs/vitest` — Astro integration for vitest
- `prettier` — Code formatter
- `prettier-plugin-astro` — Astro file formatting

## Success Criteria

- [ ] `bun run build` completes without errors
- [ ] `bun run test` runs and reports no failures (empty suite is acceptable)
- [ ] `bun run format:check` passes on all files
- [ ] Clean Architecture directories exist with correct structure
- [ ] Astro dev server starts and renders a page from `src/presentation/pages/`
- [ ] Netlify adapter is configured and build output targets Edge functions
