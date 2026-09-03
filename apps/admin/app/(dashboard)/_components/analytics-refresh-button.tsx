'use client'

import { Button } from '@workspace/ui/components/button'
import { RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

export function AnalyticsRefreshButton () {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh()
    })
  }

  return (
    <Button size="sm" variant="outline" onClick={handleRefresh} disabled={isPending}>
      <RefreshCw className={`mr-2 h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
      Refresh
    </Button>
  )
}
