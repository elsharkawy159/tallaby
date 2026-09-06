"use client";

import { useRef } from "react";
import { formatCurrency } from "@workspace/lib";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { useContainerSize } from "./use-container-size";

interface DataPoint {
  name: string;
  value: number;
  [key: string]: string | number | undefined;
}

interface BarChartProps {
  data: DataPoint[];
  isMultiple?: boolean;
  className?: string;
}

export function BarChart({
  data,
  isMultiple = false,
  className,
}: BarChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const size = useContainerSize(containerRef, [data.length]);

  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        No data for this period
      </div>
    );
  }

  const dataKeys = isMultiple
    ? Object.keys(data[0]).filter((key) => key !== "name")
    : ["value"];

  const colors = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#3b82f6"];

  return (
    <div ref={containerRef} className={`w-full h-full ${className ?? ""}`}>
      {size ? (
        <RechartsBarChart
          width={size.width}
          height={size.height}
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            strokeOpacity={0.4}
            vertical={false}
          />
          <XAxis dataKey="name" tickLine={false} axisLine={false} />
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
            formatter={(value, name) => [
              formatCurrency(Number(value ?? 0)),
              String(name).charAt(0).toUpperCase() + String(name).slice(1),
            ]}
            contentStyle={{
              borderRadius: "4px",
              border: "none",
              boxShadow:
                "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
            }}
          />
          {isMultiple && <Legend />}
          {dataKeys.map((key, index) => (
            <Bar
              key={key}
              dataKey={key}
              fill={colors[index % colors.length]}
              radius={[4, 4, 0, 0]}
              name={key.charAt(0).toUpperCase() + key.slice(1)}
            />
          ))}
        </RechartsBarChart>
      ) : null}
    </div>
  );
}
