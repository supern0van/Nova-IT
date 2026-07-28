import { readFile } from 'node:fs/promises'

import { describe, expect, it } from 'vitest'

import { parseJsonc } from './check-worker-secrets.mjs'
import { workerDomains } from './smoke-worker.mjs'

describe('admin Worker-konfiguration', () => {
  it('smoke-kontrollen täcker alla custom domains i wrangler.jsonc', async () => {
    const config = parseJsonc(await readFile(new URL('../wrangler.jsonc', import.meta.url), 'utf8')) as {
      routes?: Array<{ pattern?: unknown; custom_domain?: unknown }>
    }

    const customDomains =
      config.routes
        ?.filter((route) => route.custom_domain === true && typeof route.pattern === 'string')
        .map((route) => route.pattern as string) ?? []

    expect(workerDomains.toSorted()).toEqual(customDomains.toSorted())
  })
})
