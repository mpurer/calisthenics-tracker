'use client'

import type { SetLog, ExerciseType } from '@/lib/types'

interface Props {
  index: number
  set: SetLog
  type: ExerciseType
  onChange: (index: number, updated: SetLog) => void
  onDelete: (index: number) => void
}

export function SetRow({ index, set, type, onChange, onDelete }: Props) {
  function update(field: keyof SetLog, raw: string) {
    const value = raw === '' ? null : Number(raw)
    onChange(index, { ...set, [field]: isNaN(value as number) ? null : value })
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-500 w-10 shrink-0">Set {index + 1}</span>

      {(type === 'duration') && (
        <input
          inputMode="decimal"
          placeholder="s"
          value={set.duration ?? ''}
          onChange={e => update('duration', e.target.value)}
          className="w-16 bg-slate-900 border border-indigo-600 rounded-lg px-2 py-2 text-sm text-center text-slate-100 focus:outline-none focus:border-indigo-400"
        />
      )}

      {(type === 'reps' || type === 'reps+weight') && (
        <input
          inputMode="numeric"
          placeholder="reps"
          value={set.reps ?? ''}
          onChange={e => update('reps', e.target.value)}
          className="w-16 bg-slate-900 border border-indigo-600 rounded-lg px-2 py-2 text-sm text-center text-slate-100 focus:outline-none focus:border-indigo-400"
        />
      )}

      {type === 'reps+weight' && (
        <input
          inputMode="decimal"
          placeholder="kg"
          value={set.weight ?? ''}
          onChange={e => update('weight', e.target.value)}
          className="w-16 bg-slate-900 border border-indigo-600 rounded-lg px-2 py-2 text-sm text-center text-slate-100 focus:outline-none focus:border-indigo-400"
        />
      )}

      <button
        onClick={() => onDelete(index)}
        className="text-red-500 hover:text-red-400 text-lg leading-none px-1"
        aria-label="Delete set"
      >
        ×
      </button>
    </div>
  )
}
