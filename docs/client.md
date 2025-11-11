<!-- Inlined from packages/client/README.md -->

# @privacy-pact/client

Client-side React components and hooks.

Exports

- `ComplianceProvider` — Wrap your app and provide `apiBaseUrl`.
- `useConsent()` — Hook to read consent state and log consent actions.
- `CookieBanner` — Simple cookie banner that asks for analytics consent.

Usage (Next.js App Router)

In `app/layout.tsx`:

```tsx
import { ComplianceProvider, CookieBanner } from '@privacy-pact/client'

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html>
			<body>
				<ComplianceProvider apiBaseUrl="/api/compliance">
					<CookieBanner />
					{children}
				</ComplianceProvider>
			</body>
		</html>
	)
}
```

Notes

- `ComplianceProvider` fetches `GET /consent` on mount and exposes `logConsent` which posts to `POST /consent`.
- For production, wire `apiBaseUrl` to the actual endpoint where you mount the `@privacy-pact/server` handlers.
