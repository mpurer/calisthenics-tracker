'use client'

import type { ExerciseConfig, ExerciseLog, SetLog } from '@/lib/types'
import { SetRow } from '@/components/SetRow'

interface Props {
  config: ExerciseConfig
  value: ExerciseLog
  onChange: (updated: ExerciseLog) => void
  prefillDate: string | null
}

function emptySet(type: ExerciseConfig['type']): SetLog {
  return {
    duration: type === 'duration' ? null : undefined,
    reps: (type === 'reps' || type === 'reps+weight') ? null : undefined,
    weight: type === 'reps+weight' ? null : undefined,
  }
}

export function ExerciseLogger({ config, value, onChange, prefillDate }: Props) {
  function handleSetChange(index: number, updated: SetLog) {
    const sets = value.sets.map((s, i) => (i === index ? updated : s))
    onChange({ ...value, sets })
  }

  function addSet() {
    onChange({ ...value, sets: [...value.sets, emptySet(config.type)] })
  }

  function deleteSet(index: number) {
    onChange({ ...value, sets: value.sets.filter((_, i) => i !== index) })
  }

  return (
    <div className="bg-slate-800 rounded-xl p-4">
      <div className="font-semibold text-slate-100 mb-1">{config.name}</div>
      {prefillDate && (
        <div className="text-xs text-slate-500 mb-3">⟳ Pre-filled from {prefillDate}</div>
      )}
      <div className="flex flex-col gap-2">
        {value.sets.map((set, i) => (
          <SetRow
            key={i}
            index={i}
            set={set}
            type={config.type}
            onChange={handleSetChange}
            onDelete={deleteSet}
          />
        ))}
        <button
          onClick={addSet}
          className="text-xs text-slate-400 hover:text-slate-200 bg-slate-700 hover:bg-slate-600 rounded-lg px-3 py-1.5 w-fit mt-1 transition-colors"
        >
          + add set
        </button>
      </div>
    </div>
  )
}
