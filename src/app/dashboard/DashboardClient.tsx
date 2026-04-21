'use client'

import { useState } from 'react'
import type { WorkoutLog } from '@/lib/types'
import { getAllExercises, SESSIONS } from '@/config/training-plan'
import { getBestValue, computeStats } from '@/lib/logs'
import { ProgressChart } from '@/components/ProgressChart'
import type { ChartPoint } from '@/components/ProgressChart'
import type { ExerciseType } from '@/lib/types'

interface Props {
  logs: WorkoutLog[]
}

const allExercises = getAllExercises()

function getExerciseType(exerciseId: string): ExerciseType {
  for (const session of SESSIONS) {
    for (const block of session.blocks) {
      const ex = block.exercises.find(e => e.id === exerciseId)
      if (ex) return ex.type
    }
  }
  return 'reps'
}

export function DashboardClient({ logs }: Props) {
  const [selectedId, setSelectedId] = useState(allExercises[0]?.id ?? '')

  const type = getExerciseType(selectedId)

  const points: ChartPoint[] = logs
    .map(log => {
      const value = getBestValue(log, selectedId, type)
      if (value === null) return null
      return { date: log.date, value, isDeload: log.isDeload }
    })
    .filter((p): p is ChartPoint => p !== null)
    .sort((a, b) => a.date.localeCompare(b.date))

  const values = points.map(p => p.value)
  const stats = computeStats(values)

  const yLabel = type === 'duration' ? 's' : type === 'reps+weight' ? 'kg' : 'reps'

  return (
    <main className="max-w-md mx-auto px-4 py-8">
      <div className="mb-6">
        <a href="/" className="text-sm text-slate-500 hover:text-slate-300">← Back</a>
        <h1 className="text-xl font-bold text-slate-100 mt-2">Progress</h1>
      </div>

      <select
        value={selectedId}
        onChange={e => setSelectedId(e.target.value)}
        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-3 text-sm text-slate-100 mb-4 focus:outline-none focus:border-indigo-500"
      >
        {allExercises.map(ex => (
          <option key={ex.id} value={ex.id}>{ex.name}</option>
        ))}
      </select>

      <div className="bg-slate-800 rounded-xl p-4 mb-4">
        <ProgressChart data={points} yLabel={yLabel} />
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-slate-800 rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-indigo-400">
            {stats.allTimeBest !== null ? `${stats.allTimeBest}${yLabel}` : '—'}
          </div>
          <div className="text-xs text-slate-500 mt-1">All-time best</div>
        </div>
        <div className="bg-slate-800 rounded-xl p-3 text-center">
          <div className={`text-xl font-bold ${
            stats.changeVsPrevious === null ? 'text-slate-500' :
            stats.changeVsPrevious >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {stats.changeVsPrevious !== null ? `${stats.changeVsPrevious > 0 ? '+' : ''}${stats.changeVsPrevious}%` : '—'}
          </div>
          <div className="text-xs text-slate-500 mt-1">vs prev session</div>
        </div>
        <div className="bg-slate-800 rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-slate-200">{stats.totalSessions}</div>
          <div className="text-xs text-slate-500 mt-1">Sessions</div>
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs text-slate-500">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-indigo-600 inline-block"></span> Normal</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-purple-600 inline-block"></span> Deload</span>
      </div>
    </main>
  )
}
