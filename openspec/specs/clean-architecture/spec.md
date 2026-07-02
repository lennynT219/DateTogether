# clean-architecture Specification

## Purpose

Establish the Clean Architecture foundation: Netlify hybrid SSR adapter, layered directory structure, srcDir routing, TypeScript path aliases, and base domain entity interfaces.

## Requirements

### Requirement: Netlify SSR Adapter Configuration

The system MUST install `@astrojs/netlify` and configure `astro.config.mjs` with `output: 'hybrid'` and the Netlify adapter integration.

#### Scenario: Build produces Netlify Edge output

- GIVEN `@astrojs/netlify` is installed as a dependency
- AND `astro.config.mjs` includes the Netlify adapter and `output: 'hybrid'`
- WHEN `bun run build` executes
- THEN the build completes without errors
- AND the output is compatible with Netlify Edge deployment

#### Scenario: Dev server starts with SSR adapter

- GIVEN the Netlify adapter is configured
- WHEN `bun run dev` starts
- THEN the dev server launches without errors and serves pages

### Requirement: Clean Architecture Directory Structure

The system MUST create the following directories: `src/core/entities/`, `src/core/use-cases/`, `src/infrastructure/repositories/`, `src/infrastructure/services/`, `src/presentation/pages/`, `src/presentation/layouts/`, `src/presentation/components/`.

#### Scenario: All architecture directories exist

- GIVEN the scaffold is complete
- WHEN listing `src/` recursively
- THEN all seven directories exist with the correct nesting

#### Scenario: Existing pages migrated to presentation layer

- GIVEN `src/pages/index.astro` exists before scaffold
- WHEN the scaffold completes
- THEN `src/presentation/pages/index.astro` exists
- AND `src/pages/` directory is removed

### Requirement: srcDir Configuration

The system MUST set `srcDir: './src/presentation'` in `astro.config.mjs` so Astro resolves pages, layouts, and components from the presentation layer.

#### Scenario: Astro resolves pages from presentation

- GIVEN `srcDir` is `'./src/presentation'`
- WHEN Astro builds or runs dev server
- THEN pages are resolved from `src/presentation/pages/`

### Requirement: TypeScript Path Aliases

The system MUST configure `@core/*`, `@infrastructure/*`, and `@presentation/*` path aliases in `tsconfig.json` mapping to their respective `src/` subdirectories.

#### Scenario: Import resolves via alias

- GIVEN a TypeScript or Astro file in the project
- WHEN importing `@core/entities/user`
- THEN TypeScript resolves the import to `src/core/entities/user`
- AND `tsc --noEmit` passes without path resolution errors

### Requirement: Base Entity Interfaces

The system MUST define `User`, `Date`, and `Memory` interfaces in `src/core/entities/` as the foundational domain types.

#### Scenario: Entity interfaces are importable

- GIVEN the entities directory exists
- WHEN importing from `@core/entities/user`, `@core/entities/date`, `@core/entities/memory`
- THEN each module exports a named interface with domain-relevant fields

#### Scenario: Entity interfaces are TypeScript-valid

- GIVEN the entity files exist
- WHEN `tsc --noEmit` runs
- THEN no type errors are reported for entity definitions
