import { ReactNode } from "react";
import { Card, CardContent } from "@workspace/ui/components/card";
import { cn } from "@workspace/ui/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from "lucide-react";

const metricCardVariants = cva("transition-all", {
  variants: {
    trend: {
      positive: "text-green-600 dark:text-green-500",
      negative: "text-red-600 dark:text-red-500",
      neutral: "text-gray-600 dark:text-gray-400",
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
    if (percentageChange === 0) return <MinusIcon className="h-4 w-4" />;
    if (percentageChange && percentageChange > 0)
      return <ArrowUpIcon className="h-4 w-4" />;
    return <ArrowDownIcon className="h-4 w-4" />;
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
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {title}
            </p>
            <h3 className={cn("text-2xl font-bold mt-1", valueClassName)}>
              {value}
            </h3>
          </div>
          {icon && <div className="text-gray-400">{icon}</div>}
        </div>

        {percentageChange !== undefined && (
          <div className="flex items-center mt-3">
            <div
              className={cn(
                "flex items-center text-sm font-medium",
                metricCardVariants({ trend: currentTrend })
              )}
            >
              {getTrendIcon()}
              <span className="ml-1">{Math.abs(percentageChange)}%</span>
            </div>
            {helpText && (
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                {helpText}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
