import { useComplianceContext } from './provider'

export function useConsent() {
  const ctx = useComplianceContext()
  return {
    isLoading: ctx.isLoading,
    hasConsent: (category: string) => ctx.consents.includes(category),
    logConsent: ctx.logConsent
  }
}

export function useDsr(apiBaseUrl: string) {
  const request = async (path: string) => {
    const res = await fetch(`${apiBaseUrl}/${path}`, { method: 'POST' })
    return res.ok
  }
  return {
    isLoading: false,
    requestAccess: () => request('dsr-access'),
    requestDelete: () => request('dsr-delete')
  }
}
