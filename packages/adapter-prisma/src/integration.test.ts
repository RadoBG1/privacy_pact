import { beforeAll, afterAll, test, expect } from 'vitest'
import { execSync } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'

// Integration test: run a real Prisma DB push against a temporary SQLite file,
// then exercise PrismaAdapter end-to-end.

let tmpDir = ''
let dbFile = ''
let prisma: any
let adapter: any

beforeAll(async () => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-prisma-int-'))
  dbFile = path.join(tmpDir, 'dev.db')

  // Ensure environment points Prisma at our temp sqlite file
  const env = { ...process.env, DATABASE_URL: `file:${dbFile}` }

  // Push the schema to the temporary DB using the package schema file
  const schemaPath = path.resolve(__dirname, '..', 'prisma', 'schema.prisma')
  execSync(`npx prisma db push --schema=${schemaPath}`, { env, stdio: 'inherit' })

  // Set the env var for the Prisma client import/runtime
  process.env.DATABASE_URL = env.DATABASE_URL

  // Import PrismaClient after DATABASE_URL is set
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { PrismaClient } = require('@prisma/client')
  prisma = new PrismaClient()
  await prisma.$connect()

  // Use dynamic import for the local module so that the TS loader resolves it
  const mod = await import('./index')
  adapter = mod.PrismaAdapter(prisma)
})

afterAll(async () => {
  try {
    if (prisma) await prisma.$disconnect()
  } catch (e) {
    // ignore
  }
  try {
    if (fs.existsSync(dbFile)) fs.unlinkSync(dbFile)
    if (fs.existsSync(tmpDir)) fs.rmdirSync(tmpDir)
  } catch (e) {
    // ignore cleanup errors
  }
})

test('prisma adapter integration: logConsent / getConsent / dsr / deleteUserData', async () => {
  // Note: schema expects `categories` as a String; send a serialized value here.
  const consent = {
    userIdentifier: 'int-user-1',
    action: 'GIVEN',
    categories: JSON.stringify(['analytics']),
    wordingVersion: 'v1',
    geoRegion: 'eu'
  }

  await adapter.logConsent(consent)

  const rows = await adapter.getConsent('int-user-1')
  expect(Array.isArray(rows)).toBe(true)
  expect(rows.length).toBeGreaterThanOrEqual(1)
  expect(rows[0].userIdentifier).toBe('int-user-1')

  // DSR: log an access request (adapter should not throw)
  await expect((adapter as any).logDsrRequest({ userId: 'int-user-1' }, 'access')).resolves.not.toThrow()

  // findUserData should return an object containing consentLogs
  const data = await (adapter as any).findUserData({ userId: 'int-user-1' })
  expect(data).toHaveProperty('consentLogs')

  // deleteUserData should remove consent logs
  await (adapter as any).deleteUserData({ userId: 'int-user-1' })
  const after = await adapter.getConsent('int-user-1')
  expect(after.length).toBe(0)
})
