'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts'

export interface ChartPoint {
  date: string
  value: number
  isDeload: boolean
}

interface Props {
  data: ChartPoint[]
  yLabel: string
}

function CustomDot(props: { cx?: number; cy?: number; payload?: ChartPoint }) {
  const { cx, cy, payload } = props
  if (cx === undefined || cy === undefined || !payload) return null
  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      fill={payload.isDeload ? '#7c3aed' : '#4f46e5'}
      stroke="none"
    />
  )
}

export function ProgressChart({ data, yLabel }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-500 text-sm">
        No data yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis
          dataKey="date"
          tick={{ fill: '#64748b', fontSize: 10 }}
          tickFormatter={d => d.slice(5)}
        />
        <YAxis
          tick={{ fill: '#64748b', fontSize: 10 }}
          label={{ value: yLabel, angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }}
        />
        <Tooltip
          contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }}
          labelStyle={{ color: '#94a3b8', fontSize: 11 }}
          itemStyle={{ color: '#e2e8f0' }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#4f46e5"
          strokeWidth={2}
          dot={<CustomDot />}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
