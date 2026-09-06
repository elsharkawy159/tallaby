import { db, users, eq } from '@workspace/db'
import { getCurrentUserId } from '@/lib/get-current-user-id'
import {
  buildMetaUserDataFromRequest,
  getMetaRequestContext,
} from '@/lib/meta/meta.cookies'
import type { MetaCapiUserDataInput } from '@/lib/meta/meta.types'

/**
 * Resolve Meta CAPI user_data from the current request + optional DB profile.
 */
export async function getMetaCapiUserData (): Promise<{
  userData: MetaCapiUserDataInput
  eventSourceUrl: string | null
  userId: string | null
}> {
  const userId = await getCurrentUserId()
  let email: string | null = null
  let phone: string | null = null

  if (userId) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { email: true, phone: true },
    })
    email = user?.email ?? null
    phone = user?.phone ?? null
  }

  const ctx = await getMetaRequestContext()
  const userData = await buildMetaUserDataFromRequest({
    email,
    phone,
    externalId: userId,
  })

  return {
    userData,
    eventSourceUrl: ctx.eventSourceUrl,
    userId,
  }
}
