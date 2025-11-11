import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: [
      { find: '@privacy-pact/server', replacement: path.resolve(__dirname, '../../packages/server/src') },
      { find: '@privacy-pact/types', replacement: path.resolve(__dirname, '../../packages/types/src') },
      { find: '@privacy-pact/adapter-prisma', replacement: path.resolve(__dirname, '../../packages/adapter-prisma/src') }
    ]
  },
  test: {
    environment: 'node'
  }
})
