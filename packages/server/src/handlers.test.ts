import { describe, it, expect, vi } from 'vitest'
import { handleConsentPost, handleConsentGet } from './handlers'
import type { ComplianceAdapter, ConsentLogData } from '@privacy-pact/types'

function makeMockAdapter() {
  const logs: ConsentLogData[] = []
  const adapter: ComplianceAdapter = {
    async logConsent(data: ConsentLogData) {
      logs.push(data)
    },
    async getConsent(userIdentifier: string) {
      return logs.filter(r => r.userIdentifier === userIdentifier)
    }
  }
  return { adapter, logs }
}

describe('handlers', () => {
  it('handleConsentPost - accepts valid payload and calls adapter.logConsent', async () => {
    const { adapter, logs } = makeMockAdapter()
    const res = await handleConsentPost({
      adapter,
      requestBody: { action: 'GIVEN', categories: ['analytics'] },
      userIdentifier: 'user-123',
      geoRegion: 'gdpr',
      wordingVersion: 'privacy-v1'
    })
    expect(res.success).toBe(true)
    expect(logs.length).toBe(1)
    expect(logs[0].userIdentifier).toBe('user-123')
    expect(logs[0].categories).toEqual(['analytics'])
  })

  it('handleConsentPost - rejects invalid action', async () => {
    const { adapter } = makeMockAdapter()
    const res = await handleConsentPost({
      adapter,
      requestBody: { action: 'WRONG', categories: ['analytics'] } as any,
      userIdentifier: 'user-123'
    })
    expect(res.success).toBe(false)
    expect(res.error).toBeDefined()
  })

  it('handleConsentGet - returns stored consents for user', async () => {
    const { adapter } = makeMockAdapter()
    // seed via logConsent
    await adapter.logConsent({
      userIdentifier: 'u1',
      action: 'GIVEN',
      categories: ['analytics'],
      wordingVersion: 'v1',
      geoRegion: 'none',
      timestamp: new Date().toISOString()
    })
    const res = await handleConsentGet({ adapter, userIdentifier: 'u1' })
    expect(res.success).toBe(true)
    expect(res.data).toBeDefined()
    expect(Array.isArray(res.data)).toBe(true)
    expect(res.data![0].userIdentifier).toBe('u1')
  })
})
