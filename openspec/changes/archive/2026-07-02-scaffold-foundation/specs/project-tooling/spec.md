# project-tooling Specification

## Purpose

Provide test runner, code formatter, SCSS compilation support, and npm scripts for the development workflow. No linter (ESint was explicitly rejected by the user).

## Requirements

### Requirement: Vitest Test Runner

The system MUST install `vitest` and configure it so tests can be executed via an npm script.

#### Scenario: Test command executes successfully

- GIVEN vitest is installed and configured
- WHEN `bun run test` executes
- THEN the test runner starts and reports results (an empty suite with zero failures is acceptable)

#### Scenario: Test file is discovered and executed

- GIVEN a file matching the test pattern exists (e.g. `*.test.ts`)
- WHEN `bun run test` executes
- THEN vitest discovers and runs the test file

### Requirement: Prettier Formatter

The system MUST install `prettier` and `prettier-plugin-astro`, and provide a `.prettierrc` configuration file. The system MUST NOT install or configure any linter (ESLint or equivalent).

#### Scenario: Format check passes on clean codebase

- GIVEN Prettier is configured with the Astro plugin
- WHEN `bun run format:check` executes
- THEN all project files pass formatting validation with exit code 0

#### Scenario: Format command reformats files

- GIVEN a file with inconsistent formatting
- WHEN `bun run format` executes
- THEN the file is reformatted according to `.prettierrc` rules

### Requirement: SCSS Support

The system MUST install `sass` to enable SCSS module compilation within Astro components.

#### Scenario: SCSS modules compile during build

- GIVEN a `.scss` or `.module.scss` file exists
- WHEN `bun run build` executes
- THEN SCSS is compiled without errors

#### Scenario: SCSS import in Astro component

- GIVEN an Astro component with `<style lang="scss">`
- WHEN the dev server renders the component
- THEN styles are applied correctly

### Requirement: NPM Scripts

The system MUST define `test`, `format`, and `format:check` scripts in `package.json`.

#### Scenario: All required scripts are present

- GIVEN `package.json` has been updated
- WHEN running `bun run test`, `bun run format`, `bun run format:check`
- THEN each script executes its corresponding tool without "unknown script" errors
