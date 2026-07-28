import { execFile } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

function parseJsonc(jsonc) {
  return JSON.parse(jsonc.replace(/^\s*\/\/.*$/gm, ''))
}

async function readWorkerConfig() {
  const config = parseJsonc(await readFile(new URL('../wrangler.jsonc', import.meta.url), 'utf8'))
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

async function listWorkerSecrets(workerName) {
  const { stdout } = await execFileAsync('wrangler', ['secret', 'list', '--name', workerName], {
    windowsHide: true,
  })
  const secrets = JSON.parse(stdout)

  if (!Array.isArray(secrets)) {
    throw new Error('wrangler secret list svarade inte med en JSON-lista.')
  }

  return new Set(
    secrets
      .map((secret) => (typeof secret?.name === 'string' ? secret.name : null))
      .filter(Boolean),
  )
}

try {
  const { workerName, requiredSecrets } = await readWorkerConfig()
  const configuredSecrets = await listWorkerSecrets(workerName)
  const missingSecrets = requiredSecrets.filter((secret) => !configuredSecrets.has(secret))

  if (missingSecrets.length > 0) {
    console.error(`✗ ${workerName} saknar Worker-secret(s): ${missingSecrets.join(', ')}`)
    process.exitCode = 1
  } else {
    console.log(`✓ ${workerName} har alla obligatoriska Worker-secrets: ${requiredSecrets.join(', ')}`)
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
}
