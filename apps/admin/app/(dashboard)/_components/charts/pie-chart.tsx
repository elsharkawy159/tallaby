"use client";

import {
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

interface DataPoint {
  name: string;
  value: number;
  color?: string;
  [key: string]: string | number | undefined;
}

interface PieChartProps {
  data: DataPoint[];
  className?: string;
}

export function PieChart({ data, className }: PieChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        No data for this period
      </div>
    )
  }

  // Default colors if not provided
  const defaultColors = [
    "#6366f1",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#3b82f6",
    "#ec4899",
    "#8b5cf6",
  ];

  // Custom render for label
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: {
    cx?: number;
    cy?: number;
    midAngle?: number;
    innerRadius?: number;
    outerRadius?: number;
    percent?: number;
  }) => {
    const RADIAN = Math.PI / 180;
    const cxVal = cx ?? 0;
    const cyVal = cy ?? 0;
    const midAngleVal = midAngle ?? 0;
    const innerRadiusVal = innerRadius ?? 0;
    const outerRadiusVal = outerRadius ?? 0;
    const percentVal = percent ?? 0;
    const radius = innerRadiusVal + (outerRadiusVal - innerRadiusVal) * 0.5;
    const x = cxVal + radius * Math.cos(-midAngleVal * RADIAN);
    const y = cyVal + radius * Math.sin(-midAngleVal * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cxVal ? "start" : "end"}
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percentVal * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className={`w-full h-full ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={
                  entry.color || defaultColors[index % defaultColors.length]
                }
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number | undefined) => [
              new Intl.NumberFormat("en-EG").format(value ?? 0),
              "Value",
            ]}
            contentStyle={{
              borderRadius: "4px",
              border: "none",
              boxShadow:
                "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
            }}
          />
          <Legend />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
}
