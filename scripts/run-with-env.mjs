/* global console, process */
import { readFileSync } from 'node:fs'
import { spawn } from 'node:child_process'

const [, , envFile, command, ...args] = process.argv

if (!envFile || !command) {
  console.error('Usage: node scripts/run-with-env.mjs <env-file> <command> [...args]')
  process.exit(1)
}

const raw = readFileSync(envFile, 'utf8')
const env = { ...process.env }

for (const line of raw.split(/\r?\n/)) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eq = trimmed.indexOf('=')
  if (eq <= 0) continue
  const key = trimmed.slice(0, eq).trim()
  const value = trimmed.slice(eq + 1).trim()
  env[key] = value
}

const child = spawn(command, args, {
  stdio: 'inherit',
  shell: true,
  env,
})

child.on('exit', (code) => {
  process.exit(code ?? 1)
})
