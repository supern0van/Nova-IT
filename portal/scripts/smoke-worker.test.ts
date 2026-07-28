import { describe, expect, it, vi } from 'vitest'

import {
  checkApi,
  checkDomainRedirect,
  runSmokeWorker,
  sameJson,
} from './smoke-worker.mjs'

function createResponse(status: number, body: unknown, location = '') {
  return {
    status,
    headers: {
      get: (name: string) => (name.toLowerCase() === 'location' ? location : null),
    },
    json: vi.fn().mockResolvedValue(body),
  }
}

describe('smoke-worker', () => {
  it('jämför JSON-svar exakt', () => {
    expect(sameJson({ roll: null }, { roll: null })).toBe(true)
    expect(sameJson({ roll: 'administrator' }, { roll: null })).toBe(false)
  })

  it('godkänner skyddad domän som redirectar till inloggning', async () => {
    const logger = { log: vi.fn(), error: vi.fn() }
    const fetchRunner = vi
      .fn()
      .mockResolvedValue(createResponse(307, null, '/logga-in?next=%2F'))

    await expect(
      checkDomainRedirect('admin.nova-it.se', { fetchRunner, logger }),
    ).resolves.toBe(true)
    expect(fetchRunner).toHaveBeenCalledWith(
      'https://admin.nova-it.se',
      expect.objectContaining({ redirect: 'manual' }),
    )
    expect(logger.error).not.toHaveBeenCalled()
  })

  it('underkänner domän utan skyddad redirect', async () => {
    const logger = { log: vi.fn(), error: vi.fn() }
    const fetchRunner = vi.fn().mockResolvedValue(createResponse(200, null, ''))

    await expect(
      checkDomainRedirect('admin.nova-it.se', { fetchRunner, logger }),
    ).resolves.toBe(false)
    expect(logger.error).toHaveBeenCalledWith(
      '✗ https://admin.nova-it.se gav 200 med Location: <saknas>',
    )
  })

  it('godkänner fail-closed API-svar', async () => {
    const logger = { log: vi.fn(), error: vi.fn() }
    const fetchRunner = vi.fn().mockResolvedValue(createResponse(401, { roll: null }))

    await expect(
      checkApi(
        'admin.nova-it.se',
        { path: '/api/roll', expectedStatus: 401, expectedBody: { roll: null } },
        { fetchRunner, logger },
      ),
    ).resolves.toBe(true)
    expect(logger.error).not.toHaveBeenCalled()
  })

  it('underkänner API som öppnar för mycket', async () => {
    const logger = { log: vi.fn(), error: vi.fn() }
    const fetchRunner = vi
      .fn()
      .mockResolvedValue(createResponse(200, { roll: 'administrator' }))

    await expect(
      checkApi(
        'admin.nova-it.se',
        { path: '/api/roll', expectedStatus: 401, expectedBody: { roll: null } },
        { fetchRunner, logger },
      ),
    ).resolves.toBe(false)
    expect(logger.error).toHaveBeenCalledWith(
      '✗ https://admin.nova-it.se/api/roll gav 200 {"roll":"administrator"}; förväntade 401 {"roll":null}',
    )
  })

  it('samlar domän- och API-kontroller i en smoke-status', async () => {
    const logger = { log: vi.fn(), error: vi.fn() }
    const fetchRunner = vi
      .fn()
      .mockResolvedValueOnce(createResponse(307, null, '/logga-in?next=%2F'))
      .mockResolvedValueOnce(createResponse(401, { roll: null }))

    await expect(
      runSmokeWorker({
        domains: ['admin.nova-it.se'],
        checks: [{ path: '/api/roll', expectedStatus: 401, expectedBody: { roll: null } }],
        fetchRunner,
        logger,
      }),
    ).resolves.toBe(true)
    expect(logger.log).toHaveBeenLastCalledWith('Worker smoke passerade.')
  })
})
