# Privacy Pact documentation

Welcome to the Privacy Pact monorepo docs. This file is the landing page for developer-facing docs and links to package README files and examples.

Table of contents

- [Overview](#overview)
- [Packages](#packages)
  - [@privacy-pact/adapter-prisma](#privacy-pactadapter-prisma)
  - [@privacy-pact/server](#privacy-pactserver)
  - [@privacy-pact/client](#privacy-pactclient)
- [Examples](#examples)
- [Running tests](#running-tests)
- [Prisma integration test](#prisma-integration-test)
- [CI notes](#ci-notes)

## Overview

The repository contains the Privacy Pact library split into packages under `packages/` and an example Express app under `examples/express-app`.

## Packages

- `packages/adapter-prisma` — Prisma adapter docs and integration test instructions.
- `packages/server` — Server package docs.
- `packages/client` — Client package docs.

Each package contains a `README.md` with usage and package-specific notes. Check the package folder for additional examples and migration hints.

## Examples

See `examples/express-app/README.md` for a runnable Express example demonstrating consent endpoints and DSR flows.

## Running tests

Run tests per-package or run the full suite from the repo root.

From repo root (runs workspace scripts):

```powershell
npm test
```

Run a single package's tests (example below shows adapter-prisma):

```powershell
npm run -w @privacy-pact/adapter-prisma test
```

## Prisma integration test

The `@privacy-pact/adapter-prisma` package includes a lightweight integration test that:

- creates a temporary SQLite database file under your OS temp directory
- runs `prisma db push` against the package's `prisma/schema.prisma` to sync the schema
- instantiates `PrismaClient` pointing at the temp DB and exercises `PrismaAdapter` end-to-end
- cleans up the temporary DB file when the test finishes

To run the integration test locally (PowerShell):

```powershell
# from the repo root (uses npm workspaces)
npm run -w @privacy-pact/adapter-prisma test

# OR: run from the package folder
cd packages\adapter-prisma
npm install
npm test
```

Notes

- The test uses `npx prisma db push --schema=...` which avoids creating migration files and keeps the test isolated and repeatable.
- If `prisma`/`@prisma/client` are not installed, install them in the package: `npm install prisma @prisma/client --save-dev`.
- The integration test file is `packages/adapter-prisma/src/integration.test.ts`.

## CI notes

- Because the integration test calls the Prisma CLI, you may want to run it in a separate CI job so it doesn't slow down unit-test feedback loops.
