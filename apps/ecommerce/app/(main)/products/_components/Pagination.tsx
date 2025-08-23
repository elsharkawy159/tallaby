"use client";
import { Button } from "@workspace/ui/components/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useUrlParams } from "../../../../hooks/use-url-params";

export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

const Pagination = ({ page, totalPages }: PaginationProps) => {
  const { updateParams } = useUrlParams();
  const canGoPrevious = page > 1;
  const canGoNext = page < totalPages;

  const handlePrevious = () => {
    if (canGoPrevious) {
      updateParams({ page: page - 1 });
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      updateParams({ page: page + 1 });
    }
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center space-x-2 mt-8">
      <Button
        variant="outline"
        size="sm"
        onClick={handlePrevious}
        disabled={!canGoPrevious}
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </Button>

      <div className="text-sm text-gray-600">
        Page {page} of {totalPages}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={handleNext}
        disabled={!canGoNext}
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default Pagination;
