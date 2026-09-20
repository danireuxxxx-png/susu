import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // PGlite roda um Postgres por arquivo; sequencial evita disputa de porta.
    fileParallelism: false,
    testTimeout: 120_000,
    hookTimeout: 180_000,
    include: ['tests/**/*.test.ts'],
  },
})
