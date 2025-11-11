import { ComplianceAdapter, ConsentLogData, AuthContext, EmailAdapter } from './adapters'

export type HandleConsentPostConfig = {
  adapter: ComplianceAdapter
  requestBody: any
  geoRegion?: string
  wordingVersion?: string
  userIdentifier: string
}

export async function handleConsentPost(config: HandleConsentPostConfig): Promise<{ success: boolean; error?: string }>{
  const { adapter, requestBody, geoRegion = 'none', wordingVersion = 'v1', userIdentifier } = config

  if (!requestBody || typeof requestBody !== 'object') {
    return { success: false, error: 'Invalid request body' }
  }

  const { action, categories } = requestBody
  if (!action || (action !== 'GIVEN' && action !== 'WITHDRAWN')) {
    return { success: false, error: 'Invalid action' }
  }
  if (!Array.isArray(categories)) {
    return { success: false, error: 'Categories must be an array' }
  }

  const data: ConsentLogData = {
    userIdentifier,
    action,
    categories,
    wordingVersion,
    geoRegion,
    timestamp: new Date().toISOString()
  }

  await adapter.logConsent(data)
  return { success: true }
}

export type HandleConsentGetConfig = {
  adapter: ComplianceAdapter
  userIdentifier: string
}

export async function handleConsentGet(config: HandleConsentGetConfig): Promise<{ success: boolean; data?: ConsentLogData[]; error?: string }>{
  const { adapter, userIdentifier } = config
  if (!userIdentifier) return { success: false, error: 'Missing userIdentifier' }
  const rows = await adapter.getConsent(userIdentifier)
  return { success: true, data: rows }
}

// Phase 2 handlers (skeletons)
export type HandleDsrAccessPostConfig = {
  adapter: ComplianceAdapter
  emailAdapter: EmailAdapter
  authContext: AuthContext
}

export async function handleDsrAccessPost(config: HandleDsrAccessPostConfig): Promise<{ success: boolean; error?: string }>{
  const { adapter, emailAdapter, authContext } = config
  if (!adapter.logDsrRequest || !adapter.findUserData) {
    return { success: false, error: 'Adapter does not implement DSR methods' }
  }
  await adapter.logDsrRequest(authContext, 'access')
  const data = await adapter.findUserData(authContext)
  const attachment = { filename: 'user-data.json', content: JSON.stringify(data, null, 2) }
  if (authContext.email) {
    await emailAdapter.sendEmail({ to: authContext.email, subject: 'Your data', body: 'Attached is your data.', attachments: [attachment] })
  }
  return { success: true }
}

export type HandleDsrDeletePostConfig = {
  adapter: ComplianceAdapter
  emailAdapter: EmailAdapter
  authContext: AuthContext
}

export async function handleDsrDeletePost(config: HandleDsrDeletePostConfig): Promise<{ success: boolean; error?: string }>{
  const { adapter, emailAdapter, authContext } = config
  if (!adapter.logDsrRequest || !adapter.findUserData || !adapter.deleteUserData) {
    return { success: false, error: 'Adapter does not implement DSR methods' }
  }
  await adapter.logDsrRequest(authContext, 'delete')
  const data = await adapter.findUserData(authContext)
  const attachment = { filename: 'user-data-before-delete.json', content: JSON.stringify(data, null, 2) }
  if (authContext.email) {
    await emailAdapter.sendEmail({ to: authContext.email, subject: 'Your data (before deletion)', body: 'Attached is your data before deletion.', attachments: [attachment] })
  }
  await adapter.deleteUserData(authContext)
  if (authContext.email) {
    await emailAdapter.sendEmail({ to: authContext.email, subject: 'Account deleted', body: 'Your account and data have been deleted.' })
  }
  return { success: true }
}
