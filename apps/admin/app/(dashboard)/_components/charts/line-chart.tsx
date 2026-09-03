'use client'

import { formatCurrency } from '@workspace/lib'
import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { format } from 'date-fns'

interface DataPoint {
  date: string
  value: number
}

interface LineChartProps {
  data: DataPoint[]
  className?: string
  valueKind?: 'currency' | 'number'
}

export function LineChart ({
  data,
  className,
  valueKind = 'currency'
}: LineChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        No data for this period
      </div>
    )
  }

  const formatValue = (value: number) =>
    valueKind === 'currency'
      ? formatCurrency(value)
      : new Intl.NumberFormat('en-EG').format(value)

  return (
    <div className={`h-full w-full ${className ?? ''}`}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.4} vertical={false} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            minTickGap={15}
            tickFormatter={(dateStr) => format(new Date(dateStr), 'MMM dd')}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) =>
              value >= 1000 ? `${(value / 1000).toFixed(0)}k` : String(value)
            }
          />
          <Tooltip
            formatter={(value) => [formatValue(Number(value ?? 0)), 'Value']}
            labelFormatter={(label) => format(new Date(String(label)), 'MMM dd, yyyy')}
            contentStyle={{
              borderRadius: '4px',
              border: 'none',
              boxShadow:
                '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}
          />
          <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} dot={false} />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  )
}
