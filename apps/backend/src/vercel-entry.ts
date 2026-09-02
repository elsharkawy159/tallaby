import { handle } from 'hono/vercel'
import { app } from './api/hono-app'

/**
 * Node.js (req/res) adapter for Vercel Serverless Functions.
 * Bundled by `scripts/build.mjs` into the Build Output API function.
 */
export default handle(app)
