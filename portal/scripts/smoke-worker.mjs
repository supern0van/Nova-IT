import { pathToFileURL } from 'node:url'

/**
 * @typedef {{ status: number, headers: { get(name: string): string | null }, json(): Promise<unknown> }} SmokeResponse
 * @typedef {(url: string, options?: Record<string, unknown>) => Promise<SmokeResponse>} SmokeFetch
 * @typedef {{ log(message?: unknown, ...optionalParams: unknown[]): void, error(message?: unknown, ...optionalParams: unknown[]): void }} SmokeLogger
 * @typedef {{ path: string, expectedStatus: number, expectedBody: unknown }} ApiCheck
 */

export const workerDomains = [
  'admin.nova-it.se',
  'admin.novait.se',
  'portal.novait.se',
  'portal.nova-it.se',
]

export const apiChecks = [
  {
    path: '/api/roll',
    expectedStatus: 401,
    expectedBody: { roll: null },
  },
  {
    path: '/api/admin/systemstatus',
    expectedStatus: 401,
    expectedBody: { status: null },
  },
  {
    path: '/api/admin/profiler',
    expectedStatus: 401,
    expectedBody: { profiler: [] },
  },
  {
    path: '/api/admin/operativt',
    expectedStatus: 401,
    expectedBody: {
      kunder: [],
      arenden: [],
      bokningar: [],
      meddelanden: [],
      aktiviteter: [],
      kundanteckningar: [],
      personal: [],
    },
  },
]

const timeoutMs = 20_000

export function sameJson(actual, expected) {
  return JSON.stringify(actual) === JSON.stringify(expected)
}

/**
 * @param {string} url
 * @param {Record<string, unknown>} [options]
 * @param {SmokeFetch} [fetchRunner]
 * @returns {Promise<SmokeResponse>}
 */
export async function fetchWithTimeout(url, options = {}, fetchRunner = fetch) {
  return fetchRunner(url, {
    ...options,
    signal: AbortSignal.timeout(timeoutMs),
  })
}

/**
 * @param {string} domain
 * @param {{ fetchRunner?: SmokeFetch, logger?: SmokeLogger }} [options]
 * @returns {Promise<boolean>}
 */
export async function checkDomainRedirect(
  domain,
  { fetchRunner = fetch, logger = console } = {},
) {
  const url = `https://${domain}`
  const response = await fetchWithTimeout(url, { redirect: 'manual' }, fetchRunner)
  const location = response.headers.get('location') ?? ''
  const ok =
    [302, 307, 308].includes(response.status) &&
    (location.includes('/logga-in') || location.includes('/mfa') || location.includes('/portal'))

  if (!ok) {
    logger.error(`✗ ${url} gav ${response.status} med Location: ${location || '<saknas>'}`)
    return false
  }

  logger.log(`✓ ${url} gav ${response.status} → ${location}`)
  return true
}

/**
 * @param {string} domain
 * @param {ApiCheck} check
 * @param {{ fetchRunner?: SmokeFetch, logger?: SmokeLogger }} [options]
 * @returns {Promise<boolean>}
 */
export async function checkApi(domain, check, { fetchRunner = fetch, logger = console } = {}) {
  const url = `https://${domain}${check.path}`
  const response = await fetchWithTimeout(url, { redirect: 'manual' }, fetchRunner)
  const body = await response.json().catch(() => null)
  const ok = response.status === check.expectedStatus && sameJson(body, check.expectedBody)

  if (!ok) {
    logger.error(
      `✗ ${url} gav ${response.status} ${JSON.stringify(body)}; förväntade ${check.expectedStatus} ${JSON.stringify(check.expectedBody)}`,
    )
    return false
  }

  logger.log(`✓ ${url} gav ${response.status} ${JSON.stringify(body)}`)
  return true
}

/**
 * @param {{
 *   domains?: string[],
 *   checks?: ApiCheck[],
 *   apiDomains?: string[],
 *   fetchRunner?: SmokeFetch,
 *   logger?: SmokeLogger,
 * }} [options]
 * @returns {Promise<boolean>}
 */
export async function runSmokeWorker({
  domains = workerDomains,
  checks = apiChecks,
  apiDomains = domains,
  fetchRunner = fetch,
  logger = console,
} = {}) {
  const results = []

  for (const domain of domains) {
    results.push(await checkDomainRedirect(domain, { fetchRunner, logger }))
  }

  for (const domain of apiDomains) {
    for (const check of checks) {
      results.push(await checkApi(domain, check, { fetchRunner, logger }))
    }
  }

  const ok = results.every(Boolean)

  if (ok) {
    logger.log('Worker smoke passerade.')
  }

  return ok
}

export async function main() {
  return (await runSmokeWorker()) ? 0 : 1
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  process.exitCode = await main()
}
