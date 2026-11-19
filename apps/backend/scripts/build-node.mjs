import { rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as esbuild from 'esbuild'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const outDir = path.join(root, 'dist')

// Self-hosted Node build (apps/backend/Dockerfile): one file, dist/server.mjs,
// from src/server.ts. Same esbuild options as the Vercel build (scripts/build.mjs),
// which stays the `build` script. No type check here either: run
// `pnpm --filter backend typecheck`.

await rm(outDir, { recursive: true, force: true })

// Bundle the app and every dependency, so the runtime image needs no node_modules.
await esbuild.build({
  absWorkingDir: root,
  entryPoints: [path.join(root, 'src', 'server.ts')],
  outfile: path.join(outDir, 'server.mjs'),
  bundle: true,
  platform: 'node',
  target: 'node22',
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

console.log('Backend Node build ready: dist/server.mjs')
