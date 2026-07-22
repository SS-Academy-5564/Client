# AGENTS.md

Single source of truth for AI coding agents working in this repository.
Other agent config files (`CLAUDE.md`, `.github/copilot-instructions.md`) are
thin pointers to this file — edit **this** file, never the pointers.

## Project Overview

Client is the front-end for Pulse, built with **Angular 21** and TypeScript
(strict mode). It uses standalone components, Angular Signals, Angular Material,
and Angular's built-in i18n.

### Getting Started

```bash
cd Client
npm install
npm run start      # dev server at http://localhost:4200/
```

## Project Structure

```text
src/app/
├── core/         → singletons: guards, interceptors, services, models, constants
├── features/     → feature areas (auth, home, overview, create-organization, error, …)
├── shared/       → reusable UI, header, validators (logic-light, reusable)
└── layout/       → app shell (layout, sidebar)
src/environments/ → environment config
src/locales/      → i18n message files (messages.xlf, messages.uk.xlf)
```

## Coding Conventions

These apply to all TypeScript (`**/*.ts`) unless noted:

- **Dependency injection:** use `inject()`. Do **not** use constructor injection.
- **State:** use Angular Signals (`signal`, `computed`) for state — in services and components.
- **Imports:** use path aliases (`@core`, `@shared`, `@features`) for cross-module
  imports. **No relative paths across module boundaries.**
- **Types:** always declare explicit return types on methods and functions.
  Maintain strict types — avoid `any`. Use `type`, not `interface`, for type definitions.
- **Members:** avoid the `public` keyword (it is the default).

### Components (`features/`, `shared/`)

- Use **standalone components**; list imports in the component decorator.
- Prefer signal-based inputs (`input`, `input.required`) and outputs (`output`).
- Manage forms with `ReactiveFormsModule` (`FormBuilder`, `FormGroup`).
- Import shared UI components from `@shared`.
- Keep `shared/` components reusable and logic-light.

### Services (`core/`)

- Use `providedIn: "root"` for singleton services.

### Templates (`**/*.html`)

- Use modern control flow (`@if`, `@for`, `@switch`) — not `*ngIf` / `*ngFor`.
- Give interactive elements correct accessibility attributes
  (`[attr.aria-label]`, `[attr.aria-pressed]`, …).
- Explicitly declare button types (`type="button"`, `type="submit"`).
- Use Angular Material components (`mat-card`, `mat-form-field`, `matInput`) properly.
- Reuse design-system components (`app-button`, `app-logo`) where applicable.

## Internationalization (i18n)

Uses Angular's built-in i18n with `@angular/localize`. Translations are applied
at **build time** — each locale produces a separate bundle; there is no runtime
language switching. Supported locales: `en-US` (source), `uk` (Ukrainian).

- **Templates:** add `i18n` (element text) or `i18n-<attr>` (attributes). The
  attribute value is the *meaning* — a short disambiguating label.
- **TypeScript:** use the `$localize` tagged template literal.
- **Locale-aware formatting:** use Angular pipes (`date`, `number`, `currency`,
  `percent`) — no translation entry needed.

Workflow when adding/changing strings:

1. Add `i18n` / `i18n-*` / `$localize` markers.
2. Extract: `ng extract-i18n --output-path src/locales` (manual step; not part of `ng build`).
3. Copy new `<trans-unit>` blocks from `messages.xlf` into `messages.uk.xlf` and add `<target>` translations.
4. Commit both `.xlf` files.

## Testing

- **Unit tests:** Vitest (`describe`, `it`, `expect`, `vi`). Do **not** use Jest
  or Jasmine globals. Mock with `vi.fn()`. Configure `TestBed` for Angular
  components/services. Follow Arrange–Act–Assert. Declare explicit return types.
- **E2E tests:** Playwright (`@playwright/test`); use locator assertions
  (`expect().toHaveText`, …). Live in `e2e/`.

## Continuous Integration

Every PR runs three GitHub Actions workflows (`.github/workflows/`); all must
pass before merge:

| Workflow            | Runs                                                     |
| ------------------- | -------------------------------------------------------- |
| `format.yml`        | `npm run prettier-check`, `npm run lint-check`           |
| `tests.yml`         | `npm run typecheck`, `npm run test:coverage`, `ng build` |
| `e2e.yml`           | Playwright via `npm run e2e`                             |

Run locally before pushing:

```bash
npm run prettier-fix   # auto-fix formatting
npm run lint-fix       # auto-fix lint issues
npm run typecheck      # type-check, no emit
npm run test           # unit tests
npm run e2e            # Playwright (starts dev server automatically)
npm run build          # lint-check + prettier-check + ng build (CI's build gate)
```

## Git Workflow

- **Branches:** one per issue, named `{type}/{issue-id}-{short-description}`
  with the description kebab-cased — e.g. `feature/72-agents-md`,
  `bug/99-login-error-persists`. Types in use: `feature`, `fix`, `bug`,
  `chore`, `docs`, `devops`, `ci`.
- **Commits:** follow [Conventional Commits](https://www.conventionalcommits.org)
  — `type(scope): summary` (e.g. `feat: add overview page`,
  `fix: resolve TS path aliases`). Not enforced by a hook — keep to it by hand.
  Keep messages as short as possible — ideally a single subject line. Add a body
  only when absolutely needed (e.g. an architectural decision, a breaking change,
  or non-obvious rationale).
- **Pull requests are squash-merged**, so the PR title becomes the single commit
  on the default branch. PR titles follow `Issue {issue-id}: {description}`
  (e.g. `Issue 72: Add AGENTS.md`). This is why `main`'s history shows
  `Issue N: ...` rather than conventional-commit subjects — do **not** infer the
  per-commit format from that history.
- Rebase the branch on its target before opening/updating a PR (see the PR
  template's Definition of Done).

## Agent Behavior

* Follow existing project patterns.
* Prefer minimal, incremental changes.
* Reuse existing abstractions and shared components.
* Do not introduce new frameworks or libraries unless requested.
* Generate production-ready code by default.
* **Do not write comments for self-evident code** — good code is
  self-documenting through clear names and structure. Only add a comment when
  it explains a non-obvious architectural or design decision (the *why*) that
  a reader cannot infer from the code itself. Do not restate *what* the code
  does, do not add section banners, and do not leave TODO/task-tracking
  comments.
* After making changes, **offer to verify** them end-to-end (build, lint,
  tests, or the affected flow) before the user commits.
* Once verification passes with no issues, **give the user a ready-to-use pull
  request title and description** — the title in `Issue {issue-id}: {description}`
  form, the description following `.github/pull_request_template.md`.
