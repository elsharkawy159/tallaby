import { ReactNode } from "react";
import { Card, CardContent } from "@workspace/ui/components/card";
import { cn } from "@workspace/ui/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from "lucide-react";

const metricCardVariants = cva("transition-all", {
  variants: {
    trend: {
      positive: "text-green-600 dark:text-green-500",
      negative: "text-destructive",
      neutral: "text-muted-foreground",
    },
  },
  defaultVariants: {
    trend: "neutral",
  },
});

interface MetricCardProps extends VariantProps<typeof metricCardVariants> {
  title: string;
  value: string | number;
  icon?: ReactNode;
  percentageChange?: number;
  helpText?: string;
  className?: string;
  valueClassName?: string;
}

export function MetricCard({
  title,
  value,
  icon,
  percentageChange,
  helpText,
  trend,
  className,
  valueClassName,
}: MetricCardProps) {
  const getTrendIcon = () => {
    if (percentageChange === 0) return <MinusIcon className="size-4" />;
    if (percentageChange && percentageChange > 0)
      return <ArrowUpIcon className="size-4" />;
    return <ArrowDownIcon className="size-4" />;
  };

  const getTrendFromPercentage = () => {
    if (percentageChange === 0) return "neutral";
    if (percentageChange && percentageChange > 0) return "positive";
    return "negative";
  };

  const currentTrend =
    trend ||
    (percentageChange !== undefined ? getTrendFromPercentage() : "neutral");

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent>
        <div className="flex justify-between items-start gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3
              className={cn(
                "mt-1 text-2xl font-bold tracking-tight text-card-foreground",
                valueClassName,
              )}
            >
              {value}
            </h3>
          </div>
          {icon && (
            <div className="shrink-0 text-muted-foreground">{icon}</div>
          )}
        </div>

        {percentageChange !== undefined && (
          <div className="mt-3 flex items-center gap-2">
            <div
              className={cn(
                "flex items-center gap-1 text-sm font-medium",
                metricCardVariants({ trend: currentTrend }),
              )}
            >
              {getTrendIcon()}
              <span>{Math.abs(percentageChange)}%</span>
            </div>
            {helpText && (
              <span className="text-xs text-muted-foreground">{helpText}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
