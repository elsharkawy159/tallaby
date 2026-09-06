import { cookies, headers } from 'next/headers'
import type { MetaCapiUserDataInput } from './meta.types'

export async function getMetaRequestContext (): Promise<{
  clientIpAddress: string | null
  clientUserAgent: string | null
  fbp: string | null
  fbc: string | null
  eventSourceUrl: string | null
}> {
  const headerStore = await headers()
  const cookieStore = await cookies()

  const forwardedFor = headerStore.get('x-forwarded-for')
  const clientIpAddress =
    forwardedFor?.split(',')[0]?.trim() ||
    headerStore.get('x-real-ip') ||
    null

  const clientUserAgent = headerStore.get('user-agent')
  const fbp = cookieStore.get('_fbp')?.value ?? null
  const fbc = cookieStore.get('_fbc')?.value ?? null

  const host =
    headerStore.get('x-forwarded-host') ||
    headerStore.get('host')
  const proto = headerStore.get('x-forwarded-proto') || 'https'
  const path = headerStore.get('x-pathname') || headerStore.get('x-url') || null

  let eventSourceUrl: string | null = null
  const referer = headerStore.get('referer')
  if (referer) {
    eventSourceUrl = referer
  } else if (host) {
    eventSourceUrl = path
      ? `${proto}://${host}${path}`
      : `${proto}://${host}`
  }

  return {
    clientIpAddress,
    clientUserAgent,
    fbp,
    fbc,
    eventSourceUrl,
  }
}

export async function buildMetaUserDataFromRequest (
  extras?: Pick<MetaCapiUserDataInput, 'email' | 'phone' | 'externalId'>
): Promise<MetaCapiUserDataInput> {
  const ctx = await getMetaRequestContext()
  return {
    email: extras?.email ?? null,
    phone: extras?.phone ?? null,
    externalId: extras?.externalId ?? null,
    clientIpAddress: ctx.clientIpAddress,
    clientUserAgent: ctx.clientUserAgent,
    fbp: ctx.fbp,
    fbc: ctx.fbc,
  }
}
