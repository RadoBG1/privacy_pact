import React from 'react'
import { useDsr } from './hooks'

export const PrivacySettings: React.FC<{ apiBaseUrl: string }> = ({ apiBaseUrl }) => {
  const { isLoading, requestAccess, requestDelete } = useDsr(apiBaseUrl)
  return (
    <div>
      <h3>Privacy settings</h3>
      {isLoading && <div>Loading...</div>}
      <div>
        <button onClick={() => requestAccess()}>Download my data</button>
      </div>
      <div>
        <button onClick={() => requestDelete()}>Delete my account</button>
      </div>
    </div>
  )
}
