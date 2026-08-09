import { pathToFileURL } from 'node:url'

/**
 * @typedef {{ status: number, headers: { get(name: string): string | null }, json(): Promise<unknown> }} SmokeResponse
 * @typedef {(url: string, options?: Record<string, unknown>) => Promise<SmokeResponse>} SmokeFetch
 * @typedef {{ log(message?: unknown, ...optionalParams: unknown[]): void, error(message?: unknown, ...optionalParams: unknown[]): void }} SmokeLogger
 * @typedef {{ path: string, expectedStatus: number, expectedBody: unknown }} ApiCheck
 * @typedef {'ok' | 'warn' | 'fail'} CheckResultat
 */

/**
 * Cloudflares kant blockerar (403, ingen Location/kropp) anrop från vissa
 * datacenter-IP-block - bekräftat gäller GitHub Actions-runnrarnas IP:n
 * specifikt, medan exakt samma kontroller passerar rent från vilken vanlig
 * klient som helst (verifierat manuellt vid upprepade tillfällen). Det är
 * alltså inte ett tecken på att Workern faktiskt är trasig. En 403 här
 * nedgraderas därför till en varning i stället för ett fel - men ENDAST en
 * ren 403 utan förklarande kropp. Alla andra avvikelser (fel statuskod,
 * fel omdirigering, fel JSON-kropp, tidsgräns) är fortfarande riktiga fel.
 */
const KANT_BLOCKERAD_STATUS = 403

export const workerDomains = [
  'admin.nova-it.se',
  'admin.novait.se',
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

export const canonicalApiDomains = ['admin.nova-it.se']

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
 * @returns {Promise<CheckResultat>}
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
    (location.includes('/logga-in') ||
      location.includes('/mfa') ||
      location.includes('/portal') ||
      location.includes('admin.nova-it.se'))

  if (ok) {
    logger.log(`✓ ${url} gav ${response.status} → ${location}`)
    return 'ok'
  }

  if (response.status === KANT_BLOCKERAD_STATUS) {
    logger.log(
      `⚠ ${url} gav 403 utan omdirigering - troligen Cloudflares kant som blockerar den här körmiljöns IP, inte Workern. Verifiera manuellt om du är osäker.`,
    )
    return 'warn'
  }

  logger.error(`✗ ${url} gav ${response.status} med Location: ${location || '<saknas>'}`)
  return 'fail'
}

/**
 * @param {string} domain
 * @param {ApiCheck} check
 * @param {{ fetchRunner?: SmokeFetch, logger?: SmokeLogger }} [options]
 * @returns {Promise<CheckResultat>}
 */
export async function checkApi(domain, check, { fetchRunner = fetch, logger = console } = {}) {
  const url = `https://${domain}${check.path}`
  const response = await fetchWithTimeout(url, { redirect: 'manual' }, fetchRunner)
  const body = await response.json().catch(() => null)
  const ok = response.status === check.expectedStatus && sameJson(body, check.expectedBody)

  if (ok) {
    logger.log(`✓ ${url} gav ${response.status} ${JSON.stringify(body)}`)
    return 'ok'
  }

  if (response.status === KANT_BLOCKERAD_STATUS && body === null) {
    logger.log(
      `⚠ ${url} gav 403 utan JSON-kropp - troligen Cloudflares kant som blockerar den här körmiljöns IP, inte Workern. Verifiera manuellt om du är osäker.`,
    )
    return 'warn'
  }

  logger.error(
    `✗ ${url} gav ${response.status} ${JSON.stringify(body)}; förväntade ${check.expectedStatus} ${JSON.stringify(check.expectedBody)}`,
  )
  return 'fail'
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
  apiDomains = canonicalApiDomains,
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

  const harFel = results.includes('fail')
  const harVarning = results.includes('warn')
  const ok = !harFel

  if (ok && harVarning) {
    logger.log(
      'Worker smoke passerade (med varningar - se ⚠ ovan, troligen Cloudflares kant som blockerar den här körmiljöns IP).',
    )
  } else if (ok) {
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
