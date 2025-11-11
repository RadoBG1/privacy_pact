<!-- Inlined from packages/server/README.md -->

# @privacy-pact/server

Core server helpers for Privacy Pact.

What this package provides

- Type definitions (`ConsentLogData`, `ComplianceAdapter`, etc.) in `@privacy-pact/types`.
- Handler helpers you can use inside your server routes:
	- `handleConsentPost(config)`
	- `handleConsentGet(config)`
	- `handleDsrAccessPost(config)` (Phase 2 skeleton)
	- `handleDsrDeletePost(config)` (Phase 2 skeleton)

Usage example (Express)

```ts
import express from 'express'
import { PrismaClient } from '@prisma/client'
import { PrismaAdapter } from '@privacy-pact/adapter-prisma'
import { handleConsentPost, handleConsentGet } from '@privacy-pact/server'

const app = express()
const prisma = new PrismaClient()
const adapter = PrismaAdapter(prisma)

app.post('/api/compliance/consent', async (req, res) => {
	const userIdentifier = req.headers['x-user-id'] as string || 'anon'
	const result = await handleConsentPost({ adapter, requestBody: req.body, userIdentifier })
	if (result.success) res.json({ success: true })
	else res.status(400).json(result)
})

app.get('/api/compliance/consent', async (req, res) => {
	const userIdentifier = req.headers['x-user-id'] as string || 'anon'
	const result = await handleConsentGet({ adapter, userIdentifier })
	res.json(result)
})
```

Notes

- The package is framework-agnostic — use the handlers in Next.js API routes, Express, or any server.
- See `@privacy-pact/types` for shared type contracts.
