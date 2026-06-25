# Client

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.2.13.

## Development server

To start a local development server, run:

```bash
npm run start
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
npm run generate -- component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
npm run generate -- --help
```

## Building

To build the project run:

```bash
npm run build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
npm run test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
npm run e2e    # without UI
npm run e2e:ui # with UI
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Internationalization (i18n)

This project uses Angular's built-in i18n with `@angular/localize`. Translations are applied at build time — each locale produces a separate output bundle. There is no runtime language switching; to change locale the user must navigate to a different URL served from a different bundle.

Supported locales:

- `en-US` — source language (English)
- `uk` — Ukrainian

### Marking strings for translation

**In templates** — add the `i18n` attribute to any element whose text content should be translated:

```html
<h1 i18n="Page heading greeting">Hello</h1>
<mat-label i18n="Form field label">Email</mat-label>
```

The value of the `i18n` attribute is the **meaning** — a short label that disambiguates strings that look the same but appear in different contexts (e.g. `"Action button"` vs `"Menu item"`). It is optional but recommended.

**For HTML attributes** — use `i18n-<attributeName>`:

```html
<input i18n-placeholder="Search field placeholder" placeholder="Search..." />
```

**In TypeScript** — use the `$localize` tagged template literal:

```ts
const label = $localize`Series A`;
const greeting = $localize`Hello, ${userName}`;
```

`$localize` works the same as `i18n` in templates — strings are extracted and replaced at build time. Interpolations (`${}`) are preserved as placeholders in the translation file.

### Locale-aware pipes

For dates, numbers, and currency, use Angular's built-in pipes — they format automatically based on the active locale with no translation file entry needed:

```html
{{ amount | currency }}
<!-- $1,234.56 (en-US) / 1 234,56 USD (uk) -->
{{ date | date:'longDate' }}
<!-- January 15, 2024 / 15 січня 2024 р. -->
{{ ratio | percent }}
<!-- 42% / 42 % -->
```

### Workflow: adding or changing strings

1. Add `i18n` / `i18n-*` / `$localize` markers in your code
2. Run extraction to update the source message file:
   ```bash
   ng extract-i18n --output-path src/locales
   ```
3. Copy any new `<trans-unit>` blocks from `src/locales/messages.xlf` into `src/locales/messages.uk.xlf` and add `<target>` translations
4. Commit both `.xlf` files

Extraction is a manual developer step — it does not run automatically during `ng build`.

### Serving a specific locale locally

```bash
ng serve                      # English (default)
ng serve --configuration=uk   # Ukrainian
```

### Building for production

```bash
npm run build
```

Produces a localized output per locale under `dist/Client/browser/`:

```
dist/Client/browser/
  en-US/   ← English build
  uk/      ← Ukrainian build
```

Your server should route users to the correct folder based on the URL prefix or `Accept-Language` header.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
