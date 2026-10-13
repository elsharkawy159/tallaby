import { Card } from '@workspace/ui/components/card'
import { Skeleton } from '@workspace/ui/components/skeleton'

function SectionSkeleton ({ rows }: { rows: number }) {
  return (
    <Card className='gap-0 rounded-2xl py-0 dark:shadow-none'>
      <div className='flex items-start gap-3.5 border-b px-4 py-4 sm:px-6 sm:py-5'>
        <Skeleton className='size-9.5 rounded-[10px]' />
        <div className='flex-1 space-y-2'>
          <Skeleton className='h-4 w-36' />
          <Skeleton className='h-3 w-72 max-w-full' />
        </div>
      </div>
      <div className='space-y-5 p-4 sm:p-6'>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className='space-y-2'>
            <Skeleton className='h-3.5 w-28' />
            <Skeleton className='h-11 w-full rounded-[10px]' />
          </div>
        ))}
      </div>
    </Card>
  )
}

export function SellerSettingsSkeleton () {
  return (
    <div className='w-full p-4 pb-20 sm:p-6 sm:pb-24'>
      <div className='mb-6 flex flex-wrap items-end justify-between gap-4'>
        <Skeleton className='h-4 w-80 max-w-full' />
        <div className='flex gap-2'>
          <Skeleton className='h-8 w-36 rounded-full' />
          <Skeleton className='h-[34px] w-28 rounded-[10px]' />
        </div>
      </div>

      <div className='grid grid-cols-1 items-start gap-5 md:grid-cols-[200px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)] xl:gap-7'>
        <div className='flex gap-1.5 overflow-hidden md:flex-col md:gap-1'>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className='h-10 w-28 shrink-0 rounded-[10px] md:w-full' />
          ))}
          <Skeleton className='mt-3 hidden h-24 w-full rounded-[14px] md:block' />
        </div>
        <div className='flex flex-col gap-5'>
          <Card className='gap-0 rounded-2xl py-0 dark:shadow-none'>
            <div className='flex items-start gap-3.5 border-b px-4 py-4 sm:px-6 sm:py-5'>
              <Skeleton className='size-9.5 rounded-[10px]' />
              <div className='flex-1 space-y-2'>
                <Skeleton className='h-4 w-24' />
                <Skeleton className='h-3 w-64 max-w-full' />
              </div>
            </div>
            <div className='space-y-5 p-4 sm:p-6'>
              <div className='flex items-center gap-5'>
                <Skeleton className='size-22 rounded-full' />
                <div className='flex-1 space-y-2'>
                  <Skeleton className='h-4 w-28' />
                  <Skeleton className='h-3 w-64 max-w-full' />
                  <Skeleton className='h-[34px] w-32 rounded-[10px]' />
                </div>
              </div>
              <Skeleton className='h-11 w-full rounded-[10px]' />
              <Skeleton className='aspect-[2.4/1] w-full rounded-xl sm:aspect-[4/1]' />
            </div>
          </Card>
          <SectionSkeleton rows={2} />
          <SectionSkeleton rows={1} />
        </div>
      </div>
    </div>
  )
}
