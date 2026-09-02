import { mkdir, writeFile, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import * as esbuild from 'esbuild'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const outputRoot = path.join(root, '.vercel', 'output')
const functionDir = path.join(outputRoot, 'functions', 'index.func')

const tsc = spawnSync(
  process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
  ['exec', 'tsc', '--noEmit'],
  { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' }
)

if (tsc.status !== 0) {
  process.exit(tsc.status ?? 1)
}

await rm(outputRoot, { recursive: true, force: true })
await mkdir(functionDir, { recursive: true })

/**
 * Fully bundle the app + workspace packages into one CJS file.
 * Build Output API functions do not inherit the project's node_modules,
 * so leaving deps external would fail at runtime on Vercel.
 */
await esbuild.build({
  absWorkingDir: root,
  entryPoints: [path.join(root, 'src', 'vercel-entry.ts')],
  outfile: path.join(functionDir, 'index.mjs'),
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  jsx: 'automatic',
  logLevel: 'info',
  sourcemap: false,
  packages: 'bundle',
  banner: {
    // Some CJS-only deps still use require(); provide a shim in ESM.
    js: "import { createRequire as __createRequire } from 'node:module'; const require = __createRequire(import.meta.url);",
  },
})

await writeFile(
  path.join(functionDir, '.vc-config.json'),
  `${JSON.stringify(
    {
      runtime: 'nodejs22.x',
      handler: 'index.mjs',
      launcherType: 'Nodejs',
      shouldAddHelpers: false,
      supportsResponseStreaming: true,
    },
    null,
    2
  )}\n`
)

await writeFile(
  path.join(outputRoot, 'config.json'),
  `${JSON.stringify(
    {
      version: 3,
      routes: [
        { handle: 'filesystem' },
        { src: '/(.*)', dest: '/' },
      ],
    },
    null,
    2
  )}\n`
)

console.log('Backend build ready: .vercel/output')
