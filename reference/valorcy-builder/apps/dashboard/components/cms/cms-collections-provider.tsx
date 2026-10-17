"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"
import { listCollectionsAction } from "@/actions/cms/collection-actions"
import type { CmsCollectionListItem } from "@/types/cms/cms.types"

interface CmsCollectionsContextValue {
  collections: CmsCollectionListItem[]
  isLoading: boolean
  /** Re-fetch collections (e.g. after creating one from the sidebar). */
  refresh: () => void
}

const CmsCollectionsContext = createContext<CmsCollectionsContextValue | null>(null)

/**
 * Shares a single client-side fetch of the active project's CMS collections
 * between the sidebar accordion and the breadcrumb. The dashboard app has no
 * React Query provider, so this is a lightweight fetch-once context mounted in
 * `DashboardShell` (which wraps both the sidebar and the project layout).
 */
export function CmsCollectionsProvider({
  projectId,
  children,
}: {
  projectId: string | null
  children: React.ReactNode
}) {
  const [collections, setCollections] = useState<CmsCollectionListItem[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const load = useCallback(async () => {
    if (!projectId) {
      setCollections([])
      return
    }
    setIsLoading(true)
    try {
      const data = await listCollectionsAction({ projectId })
      setCollections(data)
    } catch {
      setCollections([])
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <CmsCollectionsContext.Provider value={{ collections, isLoading, refresh: load }}>
      {children}
    </CmsCollectionsContext.Provider>
  )
}

export function useCmsCollections(): CmsCollectionsContextValue {
  const ctx = useContext(CmsCollectionsContext)
  if (!ctx) {
    return { collections: [], isLoading: false, refresh: () => {} }
  }
  return ctx
}
