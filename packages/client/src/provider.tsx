import React, { createContext, useContext, useEffect, useState } from 'react'

type ConsentState = {
  consents: string[]
  isLoading: boolean
  logConsent: (payload: { action: 'GIVEN' | 'WITHDRAWN'; categories: string[] }) => Promise<void>
}

const DEFAULT: ConsentState = {
  consents: [],
  isLoading: true,
  logConsent: async () => {}
}

const ComplianceContext = createContext<ConsentState>(DEFAULT)

export const ComplianceProvider = (props: { apiBaseUrl: string; children?: React.ReactNode }) => {
  const { apiBaseUrl, children } = props
  const [consents, setConsents] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/consent`)
        if (!mounted) return
        if (res.ok) {
          const json = await res.json()
          // Expect { success: true, data: ConsentLogData[] }
          if (json && Array.isArray(json.data)) {
            // simplified: keep latest GIVEN categories
            const given = json.data.filter((r: any) => r.action === 'GIVEN').flatMap((r: any) => r.categories)
            setConsents(Array.from(new Set(given)))
          }
        }
      } catch (e) {
        // ignore - keep defaults
      } finally {
        if (mounted) setIsLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [apiBaseUrl])

  const logConsent = async (payload: { action: 'GIVEN' | 'WITHDRAWN'; categories: string[] }) => {
    setIsLoading(true)
    try {
      await fetch(`${apiBaseUrl}/consent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      // naive update locally
      if (payload.action === 'GIVEN') {
        setConsents((prev: string[]) => Array.from(new Set(prev.concat(payload.categories))))
      } else {
        setConsents((prev: string[]) => prev.filter((c: string) => !payload.categories.includes(c)))
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ComplianceContext.Provider value={{ consents, isLoading, logConsent }}>
      {children}
    </ComplianceContext.Provider>
  )
}

export const useComplianceContext = () => useContext(ComplianceContext)
