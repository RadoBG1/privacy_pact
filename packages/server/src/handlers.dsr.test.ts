import { describe, it, expect, vi } from 'vitest'
import { handleDsrAccessPost, handleDsrDeletePost } from './handlers'
import type { ComplianceAdapter, AuthContext } from '@privacy-pact/types'

describe('DSR handlers', () => {
  it('handleDsrAccessPost logs request, finds data and emails it', async () => {
    const findUserData = vi.fn(async (ctx: AuthContext) => ({ foo: 'bar' }))
    const logDsrRequest = vi.fn(async () => {})
    const adapter: ComplianceAdapter = {
      logConsent: async () => {},
      getConsent: async () => [],
      logDsrRequest,
      findUserData
    }
    const sendEmail = vi.fn(async () => {})
    const emailAdapter: any = { sendEmail }
    const authContext: AuthContext = { userId: 'u1', email: 'u1@example.com' }

    const res = await handleDsrAccessPost({ adapter, emailAdapter, authContext })
    expect(res.success).toBe(true)
    expect(logDsrRequest).toHaveBeenCalledWith(authContext, 'access')
    expect(findUserData).toHaveBeenCalledWith(authContext)
    expect(sendEmail).toHaveBeenCalled()
  })

  it('handleDsrDeletePost logs request, emails data before and after, and calls deleteUserData', async () => {
    const findUserData = vi.fn(async (ctx: AuthContext) => ({ foo: 'bar' }))
    const logDsrRequest = vi.fn(async () => {})
    const deleteUserData = vi.fn(async () => {})
    const adapter: ComplianceAdapter = {
      logConsent: async () => {},
      getConsent: async () => [],
      logDsrRequest,
      findUserData,
      deleteUserData
    }
    const sendEmail = vi.fn(async () => {})
    const emailAdapter: any = { sendEmail }
    const authContext: AuthContext = { userId: 'u1', email: 'u1@example.com' }

    const res = await handleDsrDeletePost({ adapter, emailAdapter, authContext })
    expect(res.success).toBe(true)
    expect(logDsrRequest).toHaveBeenCalledWith(authContext, 'delete')
    expect(findUserData).toHaveBeenCalledWith(authContext)
    expect(deleteUserData).toHaveBeenCalledWith(authContext)
    // expect two emails sent: before and after
    expect(sendEmail).toHaveBeenCalledTimes(2)
  })
})
