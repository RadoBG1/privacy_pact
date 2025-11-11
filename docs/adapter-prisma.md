<!-- Inlined from packages/adapter-prisma/README.md -->

# @privacy-pact/adapter-prisma

Prisma adapter for Privacy Pact. This package provides a thin `PrismaAdapter(prisma)` function that implements the `ComplianceAdapter` interface used by `@privacy-pact/server`.

Quick example

```ts
import { PrismaClient } from '@prisma/client'
import { PrismaAdapter } from '@privacy-pact/adapter-prisma'

const prisma = new PrismaClient()
const adapter = PrismaAdapter(prisma)
```

Prisma schema

Add the following `ConsentLog` model to your Prisma schema (see `prisma/schema.prisma` in this package for a starting point).

Notes

- The adapter expects a `consentLog` model with a `userIdentifier` field and will call `prisma.consentLog.create(...)` and `prisma.consentLog.findMany(...)`.
- You may prefer to store `categories` as a `Json` type (Postgres/MySQL) or as a separate normalized table for querying by category.
- This adapter is intentionally minimal; adapt to your app's needs.

DSR (Data Subject Request) logging

If you'd like the adapter to record DSR activity for auditing workflows, add the following `DsrRequest` model to your Prisma schema (it's included in `prisma/schema.prisma` in this package):

```prisma
model DsrRequest {
	id             String   @id @default(cuid())
	userIdentifier String
	type           String   // 'access' | 'delete'
	status         String?  // optional status (e.g. 'requested', 'completed')
	metadata       Json?    // optional JSON blob with extra details
	createdAt      DateTime @default(now())

	@@index([userIdentifier])
	@@index([type])
}
```

With that model present, `PrismaAdapter.logDsrRequest` will attempt to create a record when DSR endpoints are used.

Migration

Run Prisma migrate to add the new table to your database:

```bash
npx prisma migrate dev --name add_dsr_request
```

Or use `prisma db push` for a quick sync in development (non-migrated):

```bash
npx prisma db push
```

Privacy note

Storing DSR requests helps with compliance audits but may itself be personal data. Consider retention and minimization policies for these records.

Local development with SQLite

The package includes a `.env.example` configured for SQLite. To run migrations locally (PowerShell on Windows):

```powershell
cd packages\adapter-prisma
# install prisma tooling if you haven't already
npm install prisma @prisma/client --save-dev
# copy env example
copy .env.example .env
# generate client
npx prisma generate
# run migration (creates dev.db)
npx prisma migrate dev --name init
```

Alternatively you can run the helper script which will copy `.env.example` to `.env`, run `prisma generate` and `prisma migrate`:

```powershell
npm run prisma:setup
```

This will create `dev.db` next to `schema.prisma` when using the SQLite provider.

## Running the integration tests locally

The repository includes an end-to-end integration test that spins up a temporary SQLite
database, pushes the package Prisma schema to it, and exercises `PrismaAdapter`.
The test is fast and isolated (it creates and removes a temp DB file).

Prerequisites

- Node.js and npm available.
- `prisma` and `@prisma/client` installed in the workspace (the repo already includes them as dev deps).

Run the test (PowerShell / Windows)

```powershell
# from the repo root (uses npm workspaces)
npm run -w @privacy-pact/adapter-prisma test

# OR: run from the package folder
cd packages\adapter-prisma
npm install
npm test
```

Notes

- The integration test uses `npx prisma db push --schema=...` to sync the schema into a temporary
	SQLite file under your OS temp directory. That means it doesn't create migration files and is
	safe to run repeatedly.
- If you encounter issues where `npx prisma` is not found, ensure `prisma` is installed locally in
	the package (run `npm install prisma --save-dev`) or run `npx --yes prisma ...`.
- The test file is `src/integration.test.ts` and will clean up the temporary DB file when it finishes.

If you want this test to run in CI, consider adding a separate job because it invokes the Prisma
CLI and is slower than pure unit tests.
