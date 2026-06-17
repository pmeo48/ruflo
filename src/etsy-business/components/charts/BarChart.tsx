'use client'

import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface BarChartProps {
  data: Record<string, string | number>[]
  xKey: string
  bars: { key: string; color: string; name?: string }[]
  height?: number
  layout?: 'horizontal' | 'vertical'
  formatY?: (value: number) => string
  formatTooltip?: (value: number, name: string) => [string, string]
}

export function BarChartWrapper({ data, xKey, bars, height = 280, layout = 'horizontal', formatY, formatTooltip }: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data} layout={layout}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        {layout === 'vertical' ? (
          <>
            <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={formatY} />
            <YAxis type="category" dataKey={xKey} tick={{ fontSize: 10 }} width={100} />
          </>
        ) : (
          <>
            <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={formatY} />
          </>
        )}
        <Tooltip formatter={formatTooltip} />
        {bars.length > 1 && <Legend />}
        {bars.map((bar) => (
          <Bar key={bar.key} dataKey={bar.key} fill={bar.color} name={bar.name ?? bar.key} radius={layout === 'vertical' ? [0, 4, 4, 0] : [4, 4, 0, 0]} />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  )
}
