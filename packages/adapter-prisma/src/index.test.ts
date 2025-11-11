import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PrismaAdapter } from './index'

describe('PrismaAdapter (unit, mocked prisma)', () => {
  let prisma: any
  let adapter: ReturnType<typeof PrismaAdapter>

  beforeEach(() => {
    prisma = {
      consentLog: {
        create: vi.fn(async (opts: any) => ({ id: '1', ...opts.data })),
        findMany: vi.fn(async (opts: any) => [{ userIdentifier: opts.where.userIdentifier, action: 'GIVEN', categories: ['analytics'], wordingVersion: 'v1', geoRegion: 'none', timestamp: new Date().toISOString() }]),
        deleteMany: vi.fn(async (opts: any) => ({ count: 1 }))
      },
      dsrRequest: {
        create: vi.fn(async (opts: any) => ({ id: 'r1', ...opts.data }))
      }
    }
    adapter = PrismaAdapter(prisma)
  })

  it('logConsent calls prisma.consentLog.create with data', async () => {
  const data = { userIdentifier: 'u1', action: 'GIVEN', categories: ['analytics'], wordingVersion: 'v1', geoRegion: 'eu', timestamp: new Date().toISOString() }
  await adapter.logConsent(data as any)
    expect(prisma.consentLog.create).toHaveBeenCalledWith({ data })
  })

  it('getConsent returns rows from findMany', async () => {
    const rows = await adapter.getConsent('u1')
    expect(prisma.consentLog.findMany).toHaveBeenCalledWith({ where: { userIdentifier: 'u1' } })
    expect(Array.isArray(rows)).toBe(true)
    expect(rows[0].userIdentifier).toBe('u1')
  })

  it('logDsrRequest writes to dsrRequest when available and swallows errors', async () => {
  await (adapter as any).logDsrRequest({ userId: 'u1' } as any, 'access')
  expect(prisma.dsrRequest.create).toHaveBeenCalled()

  // simulate create throwing; adapter should not throw
  prisma.dsrRequest.create.mockImplementationOnce(() => { throw new Error('boom') })
  await expect((adapter as any).logDsrRequest({ userId: 'u1' } as any, 'delete')).resolves.not.toThrow()
  })

  it('findUserData returns {} when no identifier', async () => {
  const res = await (adapter as any).findUserData({} as any)
    expect(res).toEqual({})
  })

  it('findUserData returns consentLogs when identifier present', async () => {
  const res = await (adapter as any).findUserData({ userId: 'u1' } as any)
    expect(prisma.consentLog.findMany).toHaveBeenCalledWith({ where: { userIdentifier: 'u1' } })
    expect(res).toHaveProperty('consentLogs')
  })

  it('deleteUserData does nothing when no identifier and deletes when present', async () => {
  await expect((adapter as any).deleteUserData({} as any)).resolves.not.toThrow()
  await (adapter as any).deleteUserData({ userId: 'u1' } as any)
    expect(prisma.consentLog.deleteMany).toHaveBeenCalledWith({ where: { userIdentifier: 'u1' } })
  })
})

