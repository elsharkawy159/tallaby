import { Skeleton } from "@workspace/ui/components/skeleton"

export const CategoryShowcaseSkeleton = () => {
  return (
    <section className="py-6 px-16 rounded-t-[50px] bg-background container mx-auto">
      <div className="flex gap-4 overflow-hidden justify-center flex-wrap">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="w-32 text-center flex-shrink-0">
            <Skeleton className="size-[100px] rounded-full mx-auto mb-2.5" />
            <Skeleton className="h-4 w-20 mx-auto" />
          </div>
        ))}
      </div>
    </section>
  )
}
