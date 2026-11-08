import { Sparkles } from "lucide-react";
import { aiStoreBuildLabel, type AiStoreBuild } from "@workspace/lib/admin";
import { cn } from "@workspace/ui/lib/utils";

/** Small AI mark beside a store name when the AI Store Builder built the store. */
export function AiStoreBadge({ build, className }: { build: AiStoreBuild | null | undefined; className?: string }) {
  if (!build) return null;
  const label = aiStoreBuildLabel(build);
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={cn("relative z-10 inline-flex shrink-0 items-center text-primary", className)}
    >
      <Sparkles className="size-3.5" aria-hidden />
    </span>
  );
}
