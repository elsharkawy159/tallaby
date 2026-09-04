import {
  Card,
  CardContent,
  CardHeader,
} from '@workspace/ui/components/card'
import { Skeleton } from '@workspace/ui/components/skeleton'

export function SellerSettingsSkeleton () {
  return (
    <div className='space-y-6 p-6'>
      <div className='flex items-start justify-between gap-4'>
        <div className='space-y-2'>
          <Skeleton className='h-8 w-48' />
          <Skeleton className='h-4 w-80 max-w-full' />
        </div>
        <Skeleton className='h-8 w-32 rounded-full' />
      </div>

      <div className='grid grid-cols-1 gap-6 xl:grid-cols-5'>
        <Card className='xl:col-span-2'>
          <CardHeader>
            <Skeleton className='h-5 w-40' />
            <Skeleton className='h-4 w-56' />
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex items-center gap-4'>
              <Skeleton className='size-28 rounded-full' />
              <div className='space-y-2'>
                <Skeleton className='h-4 w-32' />
                <Skeleton className='h-3 w-40' />
              </div>
            </div>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className='h-10 w-full' />
            ))}
          </CardContent>
        </Card>

        <Card className='xl:col-span-3'>
          <CardHeader>
            <Skeleton className='h-5 w-44' />
            <Skeleton className='h-4 w-64' />
          </CardHeader>
          <CardContent className='space-y-4'>
            <Skeleton className='h-10 w-full' />
            <Skeleton className='h-24 w-full' />
            <Skeleton className='h-36 w-full rounded-xl' />
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <Skeleton className='h-28 w-full' />
              <Skeleton className='h-28 w-full' />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <Skeleton className='h-5 w-48' />
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className='h-32 w-full rounded-xl' />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
