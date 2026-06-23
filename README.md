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

This project uses Angular's built-in i18n with `@angular/localize`. Translations are applied at build time — each locale produces a separate output bundle.

Supported locales:
- `en-US` — source language (English)
- `uk` — Ukrainian

### Extracting strings

After adding or changing `i18n` markers in templates or `$localize` tags in TypeScript, regenerate the source message file:

```bash
ng extract-i18n --output-path src/locales
```

This updates `src/locales/messages.xlf`. Copy any new `<trans-unit>` blocks into `src/locales/messages.uk.xlf` and add `<target>` translations.

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
  uk/   ← Ukrainian build
```

To also produce an English build, add `en-US` to the `localize` array in the `production` configuration in `angular.json`.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
