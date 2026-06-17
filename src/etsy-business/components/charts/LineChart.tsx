'use client'

import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface LineChartProps {
  data: Record<string, string | number>[]
  xKey: string
  lines: { key: string; color: string; name?: string }[]
  height?: number
  formatY?: (value: number) => string
  formatTooltip?: (value: number, name: string) => [string, string]
}

export function LineChartWrapper({ data, xKey, lines, height = 280, formatY, formatTooltip }: LineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={formatY} />
        <Tooltip formatter={formatTooltip} />
        {lines.length > 1 && <Legend />}
        {lines.map((line) => (
          <Line key={line.key} type="monotone" dataKey={line.key} stroke={line.color} strokeWidth={2} dot={false} name={line.name ?? line.key} />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  )
}
