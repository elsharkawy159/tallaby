import { app } from './api/hono-app'

/**
 * Vercel Build Output API — Node.js Web Handler.
 * Named `fetch` export (not default Response / hono handle).
 */
export function fetch (request: Request): Response | Promise<Response> {
  const url = new URL(request.url)

  if (url.pathname === '/') {
    return Response.redirect(new URL('/api', url), 307)
  }

  return app.fetch(request)
}
