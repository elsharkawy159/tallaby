import React from "react";
import { Skeleton } from "@workspace/ui/components/skeleton";

export default function ProductsTableSkeleton() {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th className="px-4 py-2">Image</th>
            <th className="px-4 py-2">Title</th>
            <th className="px-4 py-2">Description</th>
            <th className="px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {[...Array(5)].map((_, i) => (
            <tr key={i}>
              <td className="px-4 py-2">
                <Skeleton className="w-16 h-16 rounded" />
              </td>
              <td className="px-4 py-2">
                <Skeleton className="h-4 w-32" />
              </td>
              <td className="px-4 py-2">
                <Skeleton className="h-4 w-64" />
              </td>
              <td className="px-4 py-2">
                <Skeleton className="h-8 w-20" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
