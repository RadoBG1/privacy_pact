export type ConsentAction = 'GIVEN' | 'WITHDRAWN'

export type ConsentLogData = {
  userIdentifier: string // pseudonymous id
  action: ConsentAction
  categories: string[]
  wordingVersion: string
  geoRegion: string
  timestamp?: string
}

export type AuthContext = {
  userId?: string
  email?: string
}

export interface ComplianceAdapter {
  logConsent(data: ConsentLogData): Promise<void>
  getConsent(userIdentifier: string): Promise<ConsentLogData[]>
  // Phase 2 (optional):
  logDsrRequest?(authContext: AuthContext, type: 'access' | 'delete'): Promise<void>
  findUserData?(authContext: AuthContext): Promise<Record<string, any>>
  deleteUserData?(authContext: AuthContext): Promise<void>
}

export interface EmailAdapter {
  sendEmail(config: { to: string; subject: string; body: string; attachments?: { filename: string; content: string }[] }): Promise<void>
}
