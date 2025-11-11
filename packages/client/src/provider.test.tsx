import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, afterEach, vi } from 'vitest'
import { ComplianceProvider, useComplianceContext } from './provider'

// Test helper component that uses the context
function Consumer() {
  const ctx = useComplianceContext()
  return (
    <div>
      <div data-testid="loading">{ctx.isLoading ? 'loading' : 'ready'}</div>
      <div data-testid="has-analytics">{ctx.consents.includes('analytics') ? 'yes' : 'no'}</div>
      <button onClick={() => ctx.logConsent({ action: 'GIVEN', categories: ['analytics'] })}>Give</button>
    </div>
  )
}

describe('ComplianceProvider', () => {
  const originalFetch = globalThis.fetch
  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('initially loads and then updates consent after logConsent', async () => {
    // GET /consent -> empty, POST /consent -> success
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: [] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) })
    globalThis.fetch = fetchMock as any

    render(
      <ComplianceProvider apiBaseUrl="/api/compliance">
        <Consumer />
      </ComplianceProvider>
    )

    // provider will call GET
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    expect(screen.getByTestId('loading').textContent).toBe('ready')
    expect(screen.getByTestId('has-analytics').textContent).toBe('no')

    // click Give button -> POST
    fireEvent.click(screen.getByText('Give'))
    await waitFor(() => expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(2))
    // after POST, provider updates consents locally
    expect(screen.getByTestId('has-analytics').textContent).toBe('yes')
  })
})
