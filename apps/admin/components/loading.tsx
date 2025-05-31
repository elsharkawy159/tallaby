import { cn } from "@workspace/ui/lib/utils";
import { LoaderCircle } from "lucide-react";

const Loading = ({ className }: { className?: string }) => {
  return (
    <LoaderCircle className={cn("animate-spin text-primary", className)} />
  );
};

export default Loading;
