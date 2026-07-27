import path from 'node:path'
import { fileURLToPath } from 'node:url'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

const dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Enhetstester för portalens rena logik, servergränser (proxy,
 * route-handlers, MFA-klientadapter) samt ett fåtal säkerhetskritiska
 * UI-flöden (faktorval vid inloggning, avbruten enrollment) där logiken
 * bara går att verifiera genom att faktiskt rendera komponenten.
 *
 * De flesta testfiler körs i node-miljö (snabbare, inget DOM behövs).
 * Komponenttester (`.test.tsx`) sätter `// @vitest-environment jsdom`
 * högst upp i filen för att slippa en global, långsammare jsdom-miljö för
 * hela sviten.
 */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['node_modules/**', '.next/**'],
  },
  resolve: {
    alias: {
      '@': dirname,
    },
  },
})
