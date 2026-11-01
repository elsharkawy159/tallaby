import { app } from './api/hono-app'
import { mcpApp } from './mcp/http'

/** MCP (mcp.tallaby.com/mcp) and its OAuth metadata live outside the /api app and its shared-secret middleware. */
export function isMcpPath (pathname: string): boolean {
  return pathname === '/mcp' || pathname.startsWith('/.well-known/oauth-protected-resource')
}

/**
 * Vercel Build Output API — Node.js Web Handler.
 * Named `fetch` export (not default Response / hono handle).
 */
export function fetch (request: Request): Response | Promise<Response> {
  const url = new URL(request.url)

  if (isMcpPath(url.pathname)) {
    return mcpApp.fetch(request)
  }

  if (url.pathname === '/') {
    return Response.redirect(new URL('/api', url), 307)
  }

  return app.fetch(request)
}
