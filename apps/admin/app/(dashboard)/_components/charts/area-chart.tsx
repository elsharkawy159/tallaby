"use client";

import { formatCurrency } from "@workspace/lib";
import {
  ResponsiveContainer,
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { format } from "date-fns";

interface DataPoint {
  date: string;
  value?: number;
  [key: string]: string | number | undefined;
}

interface AreaChartProps {
  data: DataPoint[];
  isMultiple?: boolean;
  className?: string;
}

export function AreaChart({
  data,
  isMultiple = false,
  className,
}: AreaChartProps) {
  // Format date for tooltip
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, "MMM dd, yyyy");
  };

  // Get data keys for multiple series
  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        No data for this period
      </div>
    )
  }

  const dataKeys = isMultiple
    ? Object.keys(data[0]).filter((key) => key !== "date")
    : ["value"];

  // Define colors for multiple series
  const colors = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#3b82f6"];

  return (
    <div className={`w-full h-full ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsAreaChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            {dataKeys.map((key, index) => (
              <linearGradient
                key={key}
                id={`color-${key}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor={colors[index % colors.length]}
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor={colors[index % colors.length]}
                  stopOpacity={0.1}
                />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            strokeOpacity={0.4}
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickFormatter={(dateStr) => {
              const date = new Date(dateStr);
              return format(date, "MMM dd");
            }}
            minTickGap={15}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => {
              if (value >= 1000) {
                return `${(value / 1000).toFixed(0)}k`;
              }
              return value;
            }}
          />
          <Tooltip
            formatter={(value: number | undefined, name: string | undefined) => [
              formatCurrency(value ?? 0),
              (name ?? "").charAt(0).toUpperCase() + (name ?? "").slice(1),
            ]}
            labelFormatter={(label) => formatDate(label)}
            contentStyle={{
              borderRadius: "4px",
              border: "none",
              boxShadow:
                "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
            }}
          />
          {isMultiple && <Legend />}
          {dataKeys.map((key, index) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              stroke={colors[index % colors.length]}
              fillOpacity={1}
              fill={`url(#color-${key})`}
              name={key.charAt(0).toUpperCase() + key.slice(1)}
            />
          ))}
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
}
