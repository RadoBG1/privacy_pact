import express from 'express'
import bodyParser from 'body-parser'
import { handleConsentPost, handleConsentGet, handleDsrAccessPost, handleDsrDeletePost, ConsoleEmailAdapter } from '@privacy-pact/server'
import type { ComplianceAdapter, AuthContext } from '@privacy-pact/types'
import type { Request, Response } from 'express'

// Simple in-memory adapter implementing ComplianceAdapter for demo
class InMemoryAdapter implements ComplianceAdapter {
  private logs: any[] = []
  private dsrLogs: any[] = []
  async logConsent(data: any) {
    this.logs.push(data)
  }
  async getConsent(userIdentifier: string) {
    return this.logs.filter(r => r.userIdentifier === userIdentifier)
  }
  // DSR methods
  async logDsrRequest(authContext: AuthContext, type: 'access' | 'delete') {
    this.dsrLogs.push({ userIdentifier: authContext.userId || authContext.email || 'unknown', type, timestamp: new Date() })
  }
  async findUserData(authContext: AuthContext) {
    const userIdentifier = authContext.userId || authContext.email
    if (!userIdentifier) return {}
    return { consentLogs: this.logs.filter(r => r.userIdentifier === userIdentifier) }
  }
  async deleteUserData(authContext: AuthContext) {
    const userIdentifier = authContext.userId || authContext.email
    if (!userIdentifier) return
    this.logs = this.logs.filter(r => r.userIdentifier !== userIdentifier)
  }
}

export function createApp(opts?: { adapter?: ComplianceAdapter; emailAdapter?: { sendEmail: (config: { to: string; subject: string; body: string; attachments?: { filename: string; content: string }[] }) => Promise<void> } }) {
  const app = express()
  app.use(bodyParser.json())

  const adapter = opts?.adapter ?? new InMemoryAdapter()
  const emailAdapter = opts?.emailAdapter ?? ConsoleEmailAdapter()

  app.post('/api/compliance/consent', async (req: Request, res: Response) => {
    const userIdentifier = req.headers['x-user-id'] as string || 'anon'
    const result = await handleConsentPost({ adapter, requestBody: req.body, userIdentifier })
    if (result.success) res.json({ success: true })
    else res.status(400).json({ success: false, error: result.error })
  })

  app.get('/api/compliance/consent', async (req: Request, res: Response) => {
    const userIdentifier = req.headers['x-user-id'] as string || 'anon'
    const result = await handleConsentGet({ adapter, userIdentifier })
    if (result.success) res.json(result)
    else res.status(400).json({ success: false, error: result.error })
  })

  // DSR endpoints
  app.post('/api/compliance/dsr-access', async (req: Request, res: Response) => {
    const authContext: AuthContext = { userId: req.headers['x-user-id'] as string, email: req.headers['x-user-email'] as string }
    const result = await handleDsrAccessPost({ adapter, emailAdapter, authContext })
    if (result.success) res.json({ success: true })
    else res.status(400).json({ success: false, error: result.error })
  })

  app.post('/api/compliance/dsr-delete', async (req: Request, res: Response) => {
    const authContext: AuthContext = { userId: req.headers['x-user-id'] as string, email: req.headers['x-user-email'] as string }
    const result = await handleDsrDeletePost({ adapter, emailAdapter, authContext })
    if (result.success) res.json({ success: true })
    else res.status(400).json({ success: false, error: result.error })
  })

  return app
}

// default export the factory for convenience (so callers can inject deps)
export default createApp

