import React from 'react'
import { useConsent } from './hooks'

export const CookieBanner: React.FC = () => {
  const { isLoading, hasConsent, logConsent } = useConsent()
  if (isLoading) return null
  if (hasConsent('analytics')) return null
  
  return (
    <div style={{ position: 'fixed', bottom: 12, left: 12, right: 12, padding: 12, background: '#fff', border: '1px solid #ddd', borderRadius: 6 }}>
      <div style={{ marginBottom: 8 }}>We use cookies to improve your experience. Do you accept analytics cookies?</div>
      <div>
        <button onClick={() => logConsent({ action: 'GIVEN', categories: ['analytics'] })} style={{ marginRight: 8 }}>Accept</button>
        <button onClick={() => logConsent({ action: 'WITHDRAWN', categories: ['analytics'] })}>Decline</button>
      </div>
    </div>
  )
}
