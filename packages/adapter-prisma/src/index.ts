import type { ConsentLogData, ComplianceAdapter, AuthContext } from '@privacy-pact/types'

export function PrismaAdapter(prisma: any): ComplianceAdapter {
  return {
    async logConsent(data: ConsentLogData) {
      // naive implementation: rely on user having a `consentLog` model
      await prisma.consentLog.create({ data })
    },

    async getConsent(userIdentifier: string) {
      const rows = await prisma.consentLog.findMany({ where: { userIdentifier } })
      return rows as ConsentLogData[]
    },

    // Phase 2 DSR methods (best-effort implementations)
    async logDsrRequest(authContext: AuthContext, type: 'access' | 'delete') {
      try {
        // If consumer has a dsrRequest model, write a record. If not, ignore.
        if (prisma.dsrRequest && typeof prisma.dsrRequest.create === 'function') {
          await prisma.dsrRequest.create({ data: { userIdentifier: authContext.userId || authContext.email || 'unknown', type, timestamp: new Date() } })
        }
      } catch (e) {
        // swallow errors to keep adapter robust
      }
    },

    async findUserData(authContext: AuthContext) {
      const userIdentifier = authContext.userId || authContext.email
      if (!userIdentifier) return {}
      const rows = await prisma.consentLog.findMany({ where: { userIdentifier } })
      return { consentLogs: rows }
    },

    async deleteUserData(authContext: AuthContext) {
      const userIdentifier = authContext.userId || authContext.email
      if (!userIdentifier) return
      await prisma.consentLog.deleteMany({ where: { userIdentifier } })
    }
  }
}
