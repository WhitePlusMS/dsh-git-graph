import { defineConfig } from 'vitest/config'

/** Discover project regressions without collecting ignored reference checkouts. */
export default defineConfig({
  test: { include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'] },
})
