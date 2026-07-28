const workerDomains = [
  'admin.nova-it.se',
  'admin.novait.se',
  'portal.novait.se',
  'portal.nova-it.se',
]

const apiChecks = [
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
]

const timeoutMs = 20_000
let failed = false

function sameJson(actual, expected) {
  return JSON.stringify(actual) === JSON.stringify(expected)
}

async function fetchWithTimeout(url, options = {}) {
  return fetch(url, {
    ...options,
    signal: AbortSignal.timeout(timeoutMs),
  })
}

async function checkDomainRedirect(domain) {
  const url = `https://${domain}`
  const response = await fetchWithTimeout(url, { redirect: 'manual' })
  const location = response.headers.get('location') ?? ''
  const ok =
    [302, 307, 308].includes(response.status) &&
    (location.includes('/logga-in') || location.includes('/mfa') || location.includes('/portal'))

  if (!ok) {
    failed = true
    console.error(`✗ ${url} gav ${response.status} med Location: ${location || '<saknas>'}`)
    return
  }

  console.log(`✓ ${url} gav ${response.status} → ${location}`)
}

async function checkApi(domain, check) {
  const url = `https://${domain}${check.path}`
  const response = await fetchWithTimeout(url, { redirect: 'manual' })
  const body = await response.json().catch(() => null)
  const ok = response.status === check.expectedStatus && sameJson(body, check.expectedBody)

  if (!ok) {
    failed = true
    console.error(
      `✗ ${url} gav ${response.status} ${JSON.stringify(body)}; förväntade ${check.expectedStatus} ${JSON.stringify(check.expectedBody)}`,
    )
    return
  }

  console.log(`✓ ${url} gav ${response.status} ${JSON.stringify(body)}`)
}

for (const domain of workerDomains) {
  await checkDomainRedirect(domain)
}

for (const check of apiChecks) {
  await checkApi('admin.nova-it.se', check)
}

if (failed) {
  process.exitCode = 1
} else {
  console.log('Worker smoke passerade.')
}
