import { describe, expect, it, vi } from 'vitest'

import {
  checkWorkerSecrets,
  listWorkerSecrets,
  parseJsonc,
  resolveWranglerInvocation,
  stripJsoncComments,
} from './check-worker-secrets.mjs'

describe('check-worker-secrets', () => {
  it('tar bort JSONC-kommentarer utan att röra URL:er i strängar', () => {
    expect(
      stripJsoncComments(`{
        "url": "https://admin.nova-it.se", // inline-kommentar
        "escaped": "säg \\"// behåll\\"",
        /*
         * blockkommentar
         */
        "name": "nova-it-admin"
      }`),
    ).toContain('"url": "https://admin.nova-it.se"')
    expect(
      stripJsoncComments(`{
        "url": "https://admin.nova-it.se", // inline-kommentar
        "escaped": "säg \\"// behåll\\""
      }`),
    ).not.toContain('inline-kommentar')
  })

  it('läser JSONC med rad-, inline- och blockkommentarer', () => {
    expect(
      parseJsonc(`{
        // Worker-namn
        "name": "nova-it-admin", // inline-kommentar
        "secrets": {
          /*
           * Obligatoriska secrets
           */
          // Obligatoriska secrets
          "required": ["NEXT_PUBLIC_SUPABASE_URL"]
        }
      }`),
    ).toEqual({
      name: 'nova-it-admin',
      secrets: {
        required: ['NEXT_PUBLIC_SUPABASE_URL'],
      },
    })
  })

  it('listar bara giltiga secret-namn från wrangler', async () => {
    const execFileRunner = vi.fn().mockResolvedValue({
      stdout: JSON.stringify([
        { name: 'NEXT_PUBLIC_SUPABASE_URL' },
        { name: '' },
        { name: null },
        { title: 'saknar-name' },
        { name: 'SUPABASE_SERVICE_ROLE_KEY' },
      ]),
    })

    await expect(listWorkerSecrets('nova-it-admin', execFileRunner)).resolves.toEqual(
      new Set(['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']),
    )
    const wrangler = resolveWranglerInvocation()
    expect(execFileRunner).toHaveBeenCalledWith(
      wrangler.command,
      [...wrangler.argsPrefix, 'secret', 'list', '--name', 'nova-it-admin'],
      { windowsHide: true },
    )
  })

  it('rapporterar saknade secrets fail-closed', async () => {
    await expect(
      checkWorkerSecrets({
        workerName: 'nova-it-admin',
        requiredSecrets: [
          'NEXT_PUBLIC_SUPABASE_URL',
          'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
          'SUPABASE_SERVICE_ROLE_KEY',
        ],
        configuredSecrets: new Set(['NEXT_PUBLIC_SUPABASE_URL']),
      }),
    ).resolves.toEqual({
      workerName: 'nova-it-admin',
      requiredSecrets: [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
        'SUPABASE_SERVICE_ROLE_KEY',
      ],
      missingSecrets: ['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_SERVICE_ROLE_KEY'],
    })
  })

  it('godkänner Worker när alla obligatoriska secrets finns', async () => {
    await expect(
      checkWorkerSecrets({
        workerName: 'nova-it-admin',
        requiredSecrets: ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
        configuredSecrets: new Set([
          'NEXT_PUBLIC_SUPABASE_URL',
          'SUPABASE_SERVICE_ROLE_KEY',
          'EXTRA_SECRET',
        ]),
      }),
    ).resolves.toEqual({
      workerName: 'nova-it-admin',
      requiredSecrets: ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
      missingSecrets: [],
    })
  })
})
