import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, afterEach, vi } from 'vitest'
import { ComplianceProvider } from './provider'
import { CookieBanner } from './CookieBanner'

describe('CookieBanner', () => {
  const originalFetch = globalThis.fetch
  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('shows the banner when no analytics consent and calls POST on Accept', async () => {
    // Mock GET /consent to return no consents, then a successful POST
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: [] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) })
    globalThis.fetch = fetchMock as any

    render(
      <ComplianceProvider apiBaseUrl="/api/compliance">
        <CookieBanner />
      </ComplianceProvider>
    )

    // Wait for provider to finish loading
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())

    const accept = await screen.findByText('Accept')
    expect(accept).toBeInTheDocument()

    fireEvent.click(accept)

    // POST should have been called (second fetch call)
    await waitFor(() => expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(2))
    const postCall = fetchMock.mock.calls[1]
    expect(postCall[0]).toBe('/api/compliance/consent')
    expect(postCall[1].method).toBe('POST')
  })
})
