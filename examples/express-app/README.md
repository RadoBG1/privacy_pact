# Express Example for Privacy Pact

This minimal example shows how to wire the `@privacy-pact/server` handlers into an Express app using an in-memory adapter.

Quick start:

1. cd examples/express-app
2. npm install
3. npm start

The server will run at http://localhost:3000 and expose:
- POST /api/compliance/consent
- GET  /api/compliance/consent

Additional DSR endpoints (demo):
- POST /api/compliance/dsr-access
- POST /api/compliance/dsr-delete

Headers:
- `x-user-id`: optional user identifier; defaults to `anon`.

Notes:
- This example imports TypeScript source from the monorepo packages. It runs via `ts-node` so you don't need to pre-build packages.
- In production, implement a persistent adapter (e.g., Prisma) and wire it into handlers.

DSR demo usage (PowerShell / Windows):

1) Request data access (will send a console "email"):

```powershell
curl -Method POST -Uri http://localhost:3000/api/compliance/dsr-access -Headers @{ 'x-user-id'='user-123'; 'x-user-email'='user@example.com' }
```

2) Request data deletion:

```powershell
curl -Method POST -Uri http://localhost:3000/api/compliance/dsr-delete -Headers @{ 'x-user-id'='user-123'; 'x-user-email'='user@example.com' }
```

Expected console output (the example uses ConsoleEmailAdapter and will log emails):

```
---[Privacy Pact Email]---
To: user@example.com
Subject: Your data
Body:
Attached is your data.
Attachments:
- user-data.json (xxx chars)
---[End Email]---
```

If you prefer to run the example without runtime path-mapping, build the packages first:

```powershell
npm run -w @privacy-pact/server build
npm run -w @privacy-pact/types build
cd .\examples\express-app
npm start
```

## Developer notes

- The repository `tsconfig.json` defines path mappings so the example imports package source directly as `@privacy-pact/*`.
- If VS Code shows `Cannot find module '@privacy-pact/...'` after cloning or switching branches, restart the TypeScript server (Command Palette → "TypeScript: Restart TS Server").

Run all tests from the repo root:

```powershell
cd C:\personal\privacy_pact
npm run test:all
```

If you'd like, I can replace this README with a more detailed walkthrough (examples, sample responses, Postman collection). Tell me which and I'll update it.
