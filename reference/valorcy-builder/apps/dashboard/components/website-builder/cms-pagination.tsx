'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@workspace/ui/components/button'
import type { SectionPaginationMeta } from '@/components/sections/registry.types'

export function CmsPagination ({ meta }: { meta: SectionPaginationMeta }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  if (meta.totalPages <= 1) return null

  function pageHref (page: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set(meta.param, String(page))
    const qs = params.toString()
    return `${pathname}${qs ? `?${qs}` : ''}#${meta.instanceId}`
  }

  const pages = Array.from({ length: meta.totalPages }, (_, i) => i + 1)

  return (
    <nav
      aria-label="Pagination"
      className="mx-auto flex w-full max-w-5xl items-center justify-center gap-1 px-4 py-6"
      data-no-instrument
    >
      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-1"
        disabled={meta.page <= 1}
        asChild={meta.page > 1}
      >
        {meta.page > 1 ? (
          <Link href={pageHref(meta.page - 1)}>
            <ChevronLeft className="size-4" />
            Previous
          </Link>
        ) : (
          <span>
            <ChevronLeft className="size-4" />
            Previous
          </span>
        )}
      </Button>

      <div className="flex items-center gap-1">
        {pages.map((page) => (
          <Button
            key={page}
            variant={page === meta.page ? 'default' : 'ghost'}
            size="sm"
            className="size-8 px-0"
            asChild={page !== meta.page}
          >
            {page === meta.page ? (
              <span aria-current="page">{page}</span>
            ) : (
              <Link href={pageHref(page)}>{page}</Link>
            )}
          </Button>
        ))}
      </div>

      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-1"
        disabled={meta.page >= meta.totalPages}
        asChild={meta.page < meta.totalPages}
      >
        {meta.page < meta.totalPages ? (
          <Link href={pageHref(meta.page + 1)}>
            Next
            <ChevronRight className="size-4" />
          </Link>
        ) : (
          <span>
            Next
            <ChevronRight className="size-4" />
          </span>
        )}
      </Button>
    </nav>
  )
}
