import { Skeleton } from "@workspace/ui/components/skeleton";
import { cn } from "@/lib/utils";

interface CategoryShowcaseSkeletonProps {
  className?: string;
}

export const CategoryShowcaseSkeleton = ({
  className,
}: CategoryShowcaseSkeletonProps) => {
  return (
    <section
      className={cn(
        "md:py-6 py-4 md:rounded-t-[50px] overflow-hidden rounded-t-4xl bg-background container px-0 mx-auto",
        className,
      )}
      aria-hidden
    >
      <div className="container flex gap-4 overflow-hidden">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="w-32 shrink-0 text-center">
            <Skeleton className="mx-auto mb-2.5 size-[100px] rounded-full" />
            <Skeleton className="mx-auto h-4 w-20" />
          </div>
        ))}
      </div>
    </section>
  );
};
