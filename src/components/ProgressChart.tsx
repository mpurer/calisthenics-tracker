'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts'

export interface ChartPoint {
  date: string
  value: number
  isDeload: boolean
  label?: string
  comment?: string
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

interface TooltipProps {
  active?: boolean
  payload?: Array<{ value: number; payload: ChartPoint }>
  label?: string
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload
  return (
    <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: '6px 10px', maxWidth: 200 }}>
      <p style={{ color: '#94a3b8', fontSize: 11, margin: 0 }}>{label}</p>
      <p style={{ color: '#e2e8f0', fontSize: 13, margin: '2px 0 0', fontWeight: 600 }}>
        {payload[0].value}
        {point.label && (
          <span style={{ color: '#64748b', fontSize: 11, fontWeight: 400, marginLeft: 6 }}>
            {point.label}
          </span>
        )}
      </p>
      {point.comment && (
        <p style={{ color: '#94a3b8', fontSize: 11, margin: '4px 0 0', fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>
          {point.comment}
        </p>
      )}
    </div>
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
        <Tooltip content={<CustomTooltip />} />
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
