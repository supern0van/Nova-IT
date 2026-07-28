import { readFile } from 'node:fs/promises'

import { describe, expect, it } from 'vitest'

import { parseJsonc } from './check-worker-secrets.mjs'
import { workerDomains } from './smoke-worker.mjs'

describe('admin Worker-konfiguration', () => {
  async function readWranglerConfig() {
    return parseJsonc(await readFile(new URL('../wrangler.jsonc', import.meta.url), 'utf8')) as {
      name?: unknown
      main?: unknown
      workers_dev?: unknown
      preview_urls?: unknown
      assets?: { directory?: unknown; binding?: unknown }
      routes?: Array<{ pattern?: unknown; custom_domain?: unknown }>
      secrets?: { required?: unknown }
      services?: Array<{ binding?: unknown; service?: unknown }>
    }
  }

  it('smoke-kontrollen täcker alla custom domains i wrangler.jsonc', async () => {
    const config = await readWranglerConfig()

    const customDomains =
      config.routes
        ?.filter((route) => route.custom_domain === true && typeof route.pattern === 'string')
        .map((route) => route.pattern as string) ?? []

    expect(workerDomains.toSorted()).toEqual(customDomains.toSorted())
  })

  it('är konfigurerad som den separata admin-Workern', async () => {
    const config = await readWranglerConfig()

    expect(config.name).toBe('nova-it-admin')
    expect(config.main).toBe('.open-next/worker.js')
    expect(config.workers_dev).toBe(false)
    expect(config.preview_urls).toBe(false)
    expect(config.assets).toEqual({
      directory: '.open-next/assets',
      binding: 'ASSETS',
    })
    expect(config.services).toContainEqual({
      binding: 'WORKER_SELF_REFERENCE',
      service: 'nova-it-admin',
    })
  })

  it('deklarerar exakt de obligatoriska Worker-secrets som release-checken kräver', async () => {
    const config = await readWranglerConfig()

    expect(config.secrets?.required).toEqual([
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
    ])
  })
})
