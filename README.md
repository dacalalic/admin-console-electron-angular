# Admin Console

Electron + Angular desktop app for signing in with a user ID, loading posts from JSONPlaceholder, caching data in local SQLite, and supporting search and comment counting.

## Tech stack

- Angular 21
- Electron 41
- TypeScript
- `better-sqlite3`
- `electron-log`
- Vitest + jsdom via Angular CLI unit-test builder
- Playwright with Electron automation
- ESLint + Prettier

## Prerequisites

- Node.js and npm
- npm is the configured package manager for this repo (`packageManager: npm@11.6.2`)
- Electron uses a native SQLite dependency (`better-sqlite3`); if native bindings become invalid, run `npm run rebuild:electron`

## Installation

```bash
npm install
```

## Running the app

Recommended local development flow:

```bash
npm run start:desktop
```

## Running unit/integration tests

Angular unit, service, facade, and component tests:

```bash
npm test
npm run test:watch
npm run test:coverage
```

Electron database integration test:

```bash
ELECTRON_RUN_AS_NODE=1 ./node_modules/.bin/electron ./node_modules/vitest/vitest.mjs run electron/database.spec.ts --environment node
```

## Running Playwright E2E tests

```bash
npm run e2e
npm run e2e:headed
```

Playwright starts the Angular dev server through its configured `webServer` and launches the real Electron app. Test artifacts are written under `e2e/test-output/`.

## Persistence details

- Database file: `path.join(app.getPath('userData'), 'admin-console.db')`
- SQLite access is handled in the Electron main process through `better-sqlite3`
- The database runs with `journal_mode = WAL`
- Tables: `users`, `session`, `posts`
- The app keeps a single active session row, caches posts per user, and stores comment counts after they are fetched

## Logging details

- Log file: `path.join(app.getPath('userData'), 'logs', 'app.log')`
- Main-process logging uses `electron-log`
- Renderer code sends structured log events through the preload bridge (`window.electronApi.log`)
- HTTP requests, responses, and failures are logged by the Angular `httpLoggingInterceptor`
- If the Electron bridge is unavailable, renderer logging falls back to the browser console

## Project structure

```text
electron/                 Electron main process, preload bridge, SQLite database layer
e2e/                      Playwright Electron E2E tests, fixtures, and helpers
src/app/core/             Logging, HTTP interceptor, Electron-facing services
src/app/features/auth/    Sign-in page, auth facade, auth API service, route guard
src/app/features/posts/   Posts page, posts facade, posts API service
src/app/shared/           Shared models
public/                   Static assets
```

## Notes / implementation decisions

- In development, the Electron window loads the Angular dev server at `http://localhost:4200`
- Routing is limited to `/sign-in` and guarded `/posts`
- On startup, the root app restores the persisted session and redirects signed-in users from `/sign-in` to `/posts`
- Posts are loaded from the local database first, then refetched from JSONPlaceholder and auto-refreshed every 10 seconds
- Comment counts are fetched separately per post and then persisted back into SQLite
- Electron E2E tests isolate app data by overriding Electron's user-data directory with `E2E_USER_DATA_DIR`
- Pagination was intentionally not implemented. The assignment/API flow fetches posts by user from JSONPlaceholder, and the remote API used in this task does not provide server-side pagination for this use case. Given the small dataset size and the task scope, the app loads the full per-user result set at once.
