import { Skeleton } from '@workspace/ui/components/skeleton'
import { PROJECT_CARD_PREVIEW_HEIGHT } from '@/components/websites/project-card-preview'

export function ProjectCardSkeleton () {
  return (
    <div className="flex w-full max-w-[360px] flex-col overflow-hidden rounded-xl border border-border/60 bg-card">
      <Skeleton
        className="w-full rounded-none"
        style={{ height: PROJECT_CARD_PREVIEW_HEIGHT }}
      />
      <div className="flex flex-col gap-2.5 p-4">
        <div className="flex items-start gap-2.5">
          <Skeleton className="size-8 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-3 w-full" />
        <div className="flex gap-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
    </div>
  )
}

export function ProjectCardSkeletonGrid () {
  return (
    <div className="flex flex-wrap gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <ProjectCardSkeleton key={i} />
      ))}
    </div>
  )
}
