'use client'

import { useState } from 'react'
import type { WorkoutLog, ExerciseType } from '@/lib/types'
import { getAllExercises, SESSIONS } from '@/config/training-plan'
import { getBestValue, getSessionVolume, computeStats, inferExerciseType } from '@/lib/logs'
import { ProgressChart } from '@/components/ProgressChart'
import type { ChartPoint } from '@/components/ProgressChart'

interface Props {
  logs: WorkoutLog[]
}

const SESSION_RATING_ID = '__session-rating__'

function getConfigExerciseType(exerciseId: string): ExerciseType | null {
  for (const session of SESSIONS) {
    for (const block of session.blocks) {
      const ex = block.exercises.find(e => e.id === exerciseId)
      if (ex) return ex.type
    }
  }
  return null
}

type Metric = 'weight' | 'reps' | 'volume'

export function DashboardClient({ logs }: Props) {
  const allConfigExercises = getAllExercises()
  const configIds = new Set(allConfigExercises.map(e => e.id))

  // Collect custom exercises from logs (not in config)
  const customMap = new Map<string, { id: string; name: string }>()
  for (const log of logs) {
    for (const ex of log.exercises) {
      if (!configIds.has(ex.id) && !customMap.has(ex.id)) {
        customMap.set(ex.id, { id: ex.id, name: ex.name })
      }
    }
  }
  const customExercises = Array.from(customMap.values())

  const [selectedId, setSelectedId] = useState(SESSION_RATING_ID)
  const [metric, setMetric] = useState<Metric>('weight')

  const isRating = selectedId === SESSION_RATING_ID

  function getExerciseType(exerciseId: string): ExerciseType {
    const configType = getConfigExerciseType(exerciseId)
    if (configType) return configType
    // Infer from log data for custom exercises
    for (const log of logs) {
      const ex = log.exercises.find(e => e.id === exerciseId)
      if (ex && ex.sets.length > 0) return inferExerciseType(ex.sets)
    }
    return 'reps'
  }

  const type = isRating ? 'reps' : getExerciseType(selectedId)
  const isWeighted = type === 'reps+weight'

  const points: ChartPoint[] = logs
    .map(log => {
      if (isRating) {
        return { date: log.date, value: log.rating, isDeload: log.isDeload }
      }

      if (isWeighted) {
        const ex = log.exercises.find(e => e.id === selectedId)
        if (!ex || ex.sets.length === 0) return null
        const comment = ex.comment

        if (metric === 'weight') {
          const value = Math.max(...ex.sets.map(s => s.weight ?? 0))
          const totalReps = ex.sets.reduce((sum, s) => sum + (s.reps ?? 0), 0)
          return { date: log.date, value, isDeload: log.isDeload, label: `${totalReps} reps`, comment }
        }
        if (metric === 'reps') {
          const value = Math.max(...ex.sets.map(s => s.reps ?? 0))
          const maxWeight = Math.max(...ex.sets.map(s => s.weight ?? 0))
          return { date: log.date, value, isDeload: log.isDeload, label: `${maxWeight} kg`, comment }
        }
        const value = getSessionVolume(log, selectedId)
        if (value === null) return null
        return { date: log.date, value, isDeload: log.isDeload, comment }
      }

      const ex = log.exercises.find(e => e.id === selectedId)
      const value = getBestValue(log, selectedId, type)
      if (value === null) return null
      return { date: log.date, value, isDeload: log.isDeload, comment: ex?.comment }
    })
    .filter((p): p is ChartPoint => p !== null)
    .sort((a, b) => a.date.localeCompare(b.date))

  const values = points.map(p => p.value)
  const stats = computeStats(values)

  let yLabel: string
  if (isRating) yLabel = '★'
  else if (isWeighted && metric === 'reps') yLabel = 'reps'
  else if (isWeighted && metric === 'volume') yLabel = 'vol'
  else if (type === 'duration') yLabel = 's'
  else if (type === 'reps+weight') yLabel = 'kg'
  else yLabel = 'reps'

  const bestLabel = isRating
    ? stats.allTimeBest !== null ? `${stats.allTimeBest}★` : '—'
    : stats.allTimeBest !== null ? `${stats.allTimeBest}${yLabel}` : '—'

  return (
    <main className="max-w-md mx-auto px-4 py-8">
      <div className="mb-6">
        <a href="/" className="text-sm text-slate-500 hover:text-slate-300">← Back</a>
        <h1 className="text-xl font-bold text-slate-100 mt-2">Progress</h1>
      </div>

      <select
        value={selectedId}
        onChange={e => { setSelectedId(e.target.value); setMetric('weight') }}
        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-3 text-sm text-slate-100 mb-4 focus:outline-none focus:border-indigo-500"
      >
        <option value={SESSION_RATING_ID}>⭐ Session Rating</option>
        <optgroup label="Exercises">
          {allConfigExercises.map(ex => (
            <option key={ex.id} value={ex.id}>{ex.name}</option>
          ))}
        </optgroup>
        {customExercises.length > 0 && (
          <optgroup label="Custom">
            {customExercises.map(ex => (
              <option key={ex.id} value={ex.id}>{ex.name}</option>
            ))}
          </optgroup>
        )}
      </select>

      {isWeighted && (
        <div className="flex gap-2 mb-4">
          {(['weight', 'reps', 'volume'] as Metric[]).map(m => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                metric === m
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {m === 'weight' ? 'Weight (kg)' : m === 'reps' ? 'Reps' : 'Volume'}
            </button>
          ))}
        </div>
      )}

      <div className="bg-slate-800 rounded-xl p-4 mb-4">
        <ProgressChart data={points} yLabel={yLabel} />
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-slate-800 rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-indigo-400">{bestLabel}</div>
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
