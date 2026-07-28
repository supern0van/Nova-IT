import { execFile } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const require = createRequire(import.meta.url)

export function resolveWranglerInvocation() {
  const wranglerPackagePath = require.resolve('wrangler/package.json')
  return {
    command: process.execPath,
    argsPrefix: [join(dirname(wranglerPackagePath), 'bin', 'wrangler.js')],
  }
}

/**
 * @param {string} jsonc
 * @returns {unknown}
 */
export function parseJsonc(jsonc) {
  return JSON.parse(jsonc.replace(/^\s*\/\/.*$/gm, ''))
}

/**
 * @param {URL} [configUrl]
 * @returns {Promise<{ workerName: string, requiredSecrets: string[] }>}
 */
export async function readWorkerConfig(configUrl = new URL('../wrangler.jsonc', import.meta.url)) {
  const config = /** @type {{ name?: unknown, secrets?: { required?: unknown } }} */ (
    parseJsonc(await readFile(configUrl, 'utf8'))
  )
  const workerName = config.name
  const requiredSecrets = config.secrets?.required

  if (typeof workerName !== 'string' || !Array.isArray(requiredSecrets)) {
    throw new Error('wrangler.jsonc saknar name eller secrets.required.')
  }

  if (!requiredSecrets.every((secret) => typeof secret === 'string' && secret.trim())) {
    throw new Error('wrangler.jsonc innehåller ogiltiga secret-namn.')
  }

  return { workerName, requiredSecrets }
}

/**
 * @param {string} workerName
 * @param {(file: string, args: string[], options: { windowsHide: boolean }) => Promise<{ stdout: string }>} [execFileRunner]
 * @returns {Promise<Set<string>>}
 */
export async function listWorkerSecrets(workerName, execFileRunner = execFileAsync) {
  const wrangler = resolveWranglerInvocation()
  const { stdout } = await execFileRunner(wrangler.command, [
    ...wrangler.argsPrefix,
    'secret',
    'list',
    '--name',
    workerName,
  ], {
    windowsHide: true,
  })
  const secrets = /** @type {unknown} */ (JSON.parse(stdout))

  if (!Array.isArray(secrets)) {
    throw new Error('wrangler secret list svarade inte med en JSON-lista.')
  }

  return new Set(
    secrets
      .map((secret) => (typeof secret?.name === 'string' ? secret.name : null))
      .filter(Boolean),
  )
}

/**
 * @param {{
 *   workerName?: string,
 *   requiredSecrets?: string[],
 *   configuredSecrets?: Set<string>,
 *   execFileRunner?: (file: string, args: string[], options: { windowsHide: boolean }) => Promise<{ stdout: string }>,
 * }} [options]
 * @returns {Promise<{ workerName: string, requiredSecrets: string[], missingSecrets: string[] }>}
 */
export async function checkWorkerSecrets({
  workerName,
  requiredSecrets,
  configuredSecrets,
  execFileRunner = execFileAsync,
} = {}) {
  const resolvedWorkerConfig =
    typeof workerName === 'string' && Array.isArray(requiredSecrets)
      ? { workerName, requiredSecrets }
      : await readWorkerConfig()

  const resolvedConfiguredSecrets =
    configuredSecrets instanceof Set
      ? configuredSecrets
      : await listWorkerSecrets(resolvedWorkerConfig.workerName, execFileRunner)

  const missingSecrets = resolvedWorkerConfig.requiredSecrets.filter(
    (secret) => !resolvedConfiguredSecrets.has(secret),
  )

  return {
    workerName: resolvedWorkerConfig.workerName,
    requiredSecrets: resolvedWorkerConfig.requiredSecrets,
    missingSecrets,
  }
}

export async function main() {
  const { workerName, requiredSecrets, missingSecrets } = await checkWorkerSecrets()

  if (missingSecrets.length > 0) {
    console.error(`✗ ${workerName} saknar Worker-secret(s): ${missingSecrets.join(', ')}`)
    return 1
  }

  console.log(`✓ ${workerName} har alla obligatoriska Worker-secrets: ${requiredSecrets.join(', ')}`)
  return 0
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  try {
    process.exitCode = await main()
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}
