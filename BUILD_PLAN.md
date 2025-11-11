# BUILD_PLAN.md: Self-Hosted Compliance Tool (v1)

## 1. Project Philosophy

-   **Model:** 100% Free and Open-Source (FOSS).
-   **Core Principle:** **Your data never leaves your server.** This is a "self-hosted" solution. We provide the tools; you own the data.
-   **Architecture:** A framework-agnostic, monorepo-based tool.
-   **Goal:** Provide a set of packages to make GDPR, CCPA, and other privacy law compliance simple for developers, starting with the Next.js ecosystem.

## 2. Core Packages (The Monorepo)

The project will be a monorepo managed by `npm` workspaces.

-   **`packages/server`:** The "brain." A framework-agnostic Node.js package.
    -   **Contains:** All core business logic, type definitions, and helper functions.
    -   **Does NOT:** Run a server. It's a library to be used *in* your server (e.g., in a Next.js API route, an Express app, or a Hono endpoint).

-   **`packages/client`:** The "UI." A React-based package.
    -   **Contains:** All client-side components (`<CookieBanner />`) and hooks (`useConsent`).
    -   **Does NOT:** Know *what* server it's talking to. It's configured to talk to your API endpoints.

-   **`packages/adapter-prisma` (and others):** "Drivers."
    -   **Contains:** The specific glue-code to connect our `server` package to a real database.
    -   This is the key to our "datastore agnostic" design.

## 3. Target Use Case (How we'll document it)

Our primary documentation will target the **Next.js App Router** user. However, the architecture ensures it works for everyone.

### The "Next.js" (Primary) Use Case:

A founder will be instructed to:

1.  **Server:** Create `app/api/compliance/[[...route]].ts`. In this file, they import helpers from `@your-tool/server` and their `PrismaAdapter` to create the API.
2.  **Client:** In their `app/layout.tsx`, they will wrap the app in the `<ComplianceProvider>` from `@your-tool/client` and add the `<CookieBanner />`.
3.  **DSR:** In `app/account/privacy/page.tsx`, they will add the `<PrivacySettings />` component.

### The "Framework-Agnostic" (Secondary) Use Case:

An Express developer will be instructed to:

1.  **Server:** In `server.js`, they create routes like `app.post('/api/consent')` and `app.post('/api/dsr-delete')`. Inside these routes, they import and use the *exact same* helpers from `@your-tool/server`.
2.  **Client:** The React side is identical.

This strategy allows us to target the "vibe" of Next.js while building a truly robust, universal tool.

## 4. Phase 1: MVP - Consent Management

The first deployable version *must* have a complete end-to-end consent (cookie banner) flow.

### `packages/server` (Phase 1 Features)

-   **`src/adapters.ts`:**
    -   **`ConsentLogData` type:** Defines the shape of a consent record:
        -   `userIdentifier: string` (a pseudonymous ID)
        -   `action: 'GIVEN' | 'WITHDRAWN'`
        -   `categories: string[]` (e.g., `['analytics', 'marketing']`)
        -   `wordingVersion: string` (e.g., "privacy-policy-v1.2")
        -   `geoRegion: string` (e.g., "gdpr", "ccpa", "none")
    -   **`ComplianceAdapter` interface:** Defines the "contract" for all database adapters.
        -   `logConsent(data: ConsentLogData): Promise<void>`
        -   `getConsent(userIdentifier: string): Promise<ConsentLogData[]>`

-   **`src/handlers.ts`:**
    -   **`handleConsentPost(config)`:** The main logic helper.
        -   `config` contains: `adapter`, `requestBody`, `geoRegion`, `wordingVersion`, `userIdentifier`.
        -   It parses the request, validates it, and calls `adapter.logConsent(...)`.
    -   **`handleConsentGet(config)`:**
        -   `config` contains: `adapter`, `userIdentifier`.
        -   Calls `adapter.getConsent(...)` and returns the current consent state.

### `packages/adapter-prisma` (Phase 1 Features)

-   **`src/index.ts`:**
    -   **`PrismaAdapter(prisma: PrismaClient)`:** The exported function that implements the `ComplianceAdapter` interface.
    -   `logConsent` will run `prisma.consentLog.create(...)`.
    -   `getConsent` will run `prisma.consentLog.findMany(...)`.
-   **`prisma/schema.prisma` (in documentation):**
    -   We must provide the user with the exact Prisma model for the `ConsentLog` table.

### `packages/client` (Phase 1 Features)

-   **`src/provider.tsx`:**
    -   **`<ComplianceProvider>`:** A React Context provider.
        -   Props: `apiBaseUrl: string` (e.g., "/api/compliance").
        -   State: `consents: string[]`, `isLoading: boolean`.
        -   On mount, it `fetch`es from `${apiBaseUrl}/consent` to get the user's state.
-   **`src/hooks.tsx`:**
    -   **`useConsent()`:** The hook to read from the provider.
        -   Returns: `isLoading`, `hasConsent(category: string): boolean`, and a `logConsent` function.
-   **`src/CookieBanner.tsx`:**
    -   **`<CookieBanner />`:** The main UI component.
    -   Uses `useConsent()`. Returns `null` if `isLoading` or if consent is already given.
    -   Has an "Accept" button that calls the `logConsent` function from the hook.

## 5. Phase 2: DSR (Data Subject Request) Portal

This phase handles the "Right to Access" and "Right to Erasure" using the "authenticated user" model.

### `packages/server` (Phase 2 Features)

-   **`src/adapters.ts` (Extended):**
    -   **`EmailAdapter` interface:**
        -   `sendEmail(config): Promise<void>`
        -   `config` includes: `to`, `subject`, `body`, `attachments?: [{ filename: string, content: string }]`.
    -   **`ComplianceAdapter` interface (Extended):**
        -   `logDsrRequest(authContext: AuthContext, type: 'access' | 'delete'): Promise<void>`
        -   `findUserData(authContext: AuthContext): Promise<Record<string, any>>`
        -   `deleteUserData(authContext: AuthContext): Promise<void>`
-   **`src/handlers.ts` (Extended):**
    -   **`handleDsrAccessPost(config)`:**
        -   `config` includes: `adapter`, `emailAdapter`, `authContext`, `findUserData`.
        -   **Flow:**
            1.  Calls `logDsrRequest`.
            2.  Calls `findUserData` (the user's function) to get a JSON blob.
            3.  Calls `emailAdapter.sendEmail` to send the JSON blob as an attachment.
    -   **`handleDsrDeletePost(config)`:**
        -   `config` includes: `adapter`, `emailAdapter`, `authContext`, `findUserData`, `deleteUserData`.
        -   **Flow:**
            1.  Calls `logDsrRequest`.
            2.  Calls `findUserData` to get the data.
            3.  Calls `emailAdapter.sendEmail` (Step 1: "Here is your data...").
            4.  Calls `deleteUserData` (the user's function) to erase the user.
            5.  Calls `emailAdapter.sendEmail` (Step 2: "Your account is deleted.").

### `packages/client` (Phase 2 Features)

-   **`src/hooks.tsx` (Extended):**
    -   **`useDsr()`:** A new hook.
        -   Returns: `isLoading`, `requestAccess()`, `requestDelete()`.
        -   These functions `POST` to `${apiBaseUrl}/dsr-access` and `${apiBaseUrl}/dsr-delete`.
-   **`src/PrivacySettings.tsx`:**
    -   **`<PrivacySettings />`:** A pre-built component.
        -   Uses `useDsr()`.
        -   Provides "Download My Data" and "Delete My Account" buttons, wired up to the hook.