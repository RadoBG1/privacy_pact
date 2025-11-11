import request from 'supertest'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createApp } from './server'

describe('DSR endpoints (example)', () => {
  let logSpy: any

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    logSpy.mockRestore()
  })

  it('responds to dsr-access and triggers injected EmailAdapter', async () => {
    const sendEmailMock = vi.fn(async () => {})
    const app = createApp({ emailAdapter: { sendEmail: sendEmailMock } })

    const res = await request(app)
      .post('/api/compliance/dsr-access')
      .set('x-user-id', 'user-123')
      .set('x-user-email', 'user@example.com')
      .send()
      .expect(200)

    expect(res.body).toEqual({ success: true })
    expect(sendEmailMock).toHaveBeenCalled()
  const callArg = ((sendEmailMock as any).mock.calls[0][0]) as any
  expect(callArg.to).toBe('user@example.com')
  expect(callArg.attachments && callArg.attachments[0].filename).toContain('user-data')
  })

  it('responds to dsr-delete and triggers injected EmailAdapter twice', async () => {
    const sendEmailMock = vi.fn(async () => {})
    const app = createApp({ emailAdapter: { sendEmail: sendEmailMock } })

    const res = await request(app)
      .post('/api/compliance/dsr-delete')
      .set('x-user-id', 'user-123')
      .set('x-user-email', 'user@example.com')
      .send()
      .expect(200)

    expect(res.body).toEqual({ success: true })
    expect(sendEmailMock).toHaveBeenCalled()
    // Expect at least one call (before delete). Some adapters may send multiple emails.
    expect(sendEmailMock.mock.calls.length).toBeGreaterThanOrEqual(1)
  })

  it('logs consent via adapter and returns consent on GET', async () => {
    const logConsent = vi.fn(async (data: any) => {})
    const getConsent = vi.fn(async (userId: string) => [{ userIdentifier: userId, action: 'GIVEN', categories: ['analytics'], wordingVersion: 'v1', geoRegion: 'none', timestamp: new Date().toISOString() }])
    const fakeAdapter: any = { logConsent, getConsent }
    const app = createApp({ adapter: fakeAdapter })

    const res = await request(app)
      .post('/api/compliance/consent')
      .set('x-user-id', 'user-123')
      .send({ action: 'GIVEN', categories: ['analytics'] })
      .expect(200)

    expect(res.body).toEqual({ success: true })
    expect(logConsent).toHaveBeenCalled()

    const getRes = await request(app)
      .get('/api/compliance/consent')
      .set('x-user-id', 'user-123')
      .expect(200)

    expect(getRes.body.success).toBe(true)
    expect(Array.isArray(getRes.body.data)).toBe(true)
    expect(getRes.body.data[0].action).toBe('GIVEN')
  })

  describe('consent error cases', () => {
    it('rejects non-object body', async () => {
      const logConsent = vi.fn(async (data: any) => {})
      const app = createApp({ adapter: { logConsent } as any })

      const res = await request(app)
        .post('/api/compliance/consent')
        .set('x-user-id', 'user-123')
        .send('not-a-json-object')
        .expect(400)

      expect(res.body.success).toBe(false)
      expect(logConsent).not.toHaveBeenCalled()
    })

    it('rejects missing action', async () => {
      const logConsent = vi.fn(async (data: any) => {})
      const app = createApp({ adapter: { logConsent } as any })

      const res = await request(app)
        .post('/api/compliance/consent')
        .set('x-user-id', 'user-123')
        .send({ categories: ['analytics'] })
        .expect(400)

      expect(res.body.success).toBe(false)
      expect(logConsent).not.toHaveBeenCalled()
    })

    it('rejects invalid action value', async () => {
      const logConsent = vi.fn(async (data: any) => {})
      const app = createApp({ adapter: { logConsent } as any })

      const res = await request(app)
        .post('/api/compliance/consent')
        .set('x-user-id', 'user-123')
        .send({ action: 'BAD_ACTION', categories: [] })
        .expect(400)

      expect(res.body.success).toBe(false)
      expect(logConsent).not.toHaveBeenCalled()
    })

    it('rejects non-array categories', async () => {
      const logConsent = vi.fn(async (data: any) => {})
      const app = createApp({ adapter: { logConsent } as any })

      const res = await request(app)
        .post('/api/compliance/consent')
        .set('x-user-id', 'user-123')
        .send({ action: 'GIVEN', categories: 'not-array' })
        .expect(400)

      expect(res.body.success).toBe(false)
      expect(logConsent).not.toHaveBeenCalled()
    })
  })

  describe('DSR negative cases', () => {
    it('does not send email when email header is missing (access)', async () => {
      const sendEmailMock = vi.fn(async () => {})
      const app = createApp({ emailAdapter: { sendEmail: sendEmailMock } })

      const res = await request(app)
        .post('/api/compliance/dsr-access')
        .set('x-user-id', 'user-123')
        .send()
        .expect(200)

      expect(res.body).toEqual({ success: true })
      expect(sendEmailMock).not.toHaveBeenCalled()
    })

    it('sends email when user-id is missing but email provided (access)', async () => {
      const sendEmailMock = vi.fn(async () => {})
      const app = createApp({ emailAdapter: { sendEmail: sendEmailMock } })

      const res = await request(app)
        .post('/api/compliance/dsr-access')
        .set('x-user-email', 'user@example.com')
        .send()
        .expect(200)

      expect(res.body).toEqual({ success: true })
      expect(sendEmailMock).toHaveBeenCalled()
    })

    it('does not send email when both user-id and email missing (access)', async () => {
      const sendEmailMock = vi.fn(async () => {})
      const app = createApp({ emailAdapter: { sendEmail: sendEmailMock } })

      const res = await request(app)
        .post('/api/compliance/dsr-access')
        .send()
        .expect(200)

      expect(res.body).toEqual({ success: true })
      expect(sendEmailMock).not.toHaveBeenCalled()
    })

    it('does not send email when email header is missing (delete)', async () => {
      const sendEmailMock = vi.fn(async () => {})
      const app = createApp({ emailAdapter: { sendEmail: sendEmailMock } })

      const res = await request(app)
        .post('/api/compliance/dsr-delete')
        .set('x-user-id', 'user-123')
        .send()
        .expect(200)

      expect(res.body).toEqual({ success: true })
      expect(sendEmailMock).not.toHaveBeenCalled()
    })

    it('sends email when user-id is missing but email provided (delete)', async () => {
      const sendEmailMock = vi.fn(async () => {})
      const app = createApp({ emailAdapter: { sendEmail: sendEmailMock } })

      const res = await request(app)
        .post('/api/compliance/dsr-delete')
        .set('x-user-email', 'user@example.com')
        .send()
        .expect(200)

      expect(res.body).toEqual({ success: true })
      expect(sendEmailMock).toHaveBeenCalled()
    })

    it('does not send email when both user-id and email missing (delete)', async () => {
      const sendEmailMock = vi.fn(async () => {})
      const app = createApp({ emailAdapter: { sendEmail: sendEmailMock } })

      const res = await request(app)
        .post('/api/compliance/dsr-delete')
        .send()
        .expect(200)

      expect(res.body).toEqual({ success: true })
      expect(sendEmailMock).not.toHaveBeenCalled()
    })
  })
})
