import { Card, CardContent, CardHeader } from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";

export function AffiliateSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="mb-2 h-8 w-20" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="rounded-md border">
        <div className="space-y-4 p-4">
          <Skeleton className="h-10 w-full" />
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
