'use client'

import type { ExerciseConfig, ExerciseLog, SetLog } from '@/lib/types'
import { SetRow } from '@/components/SetRow'

interface Props {
  config: ExerciseConfig
  value: ExerciseLog
  onChange: (updated: ExerciseLog) => void
  prefillDate: string | null
  skipped: boolean
  onSkip: () => void
}

function emptySet(type: ExerciseConfig['type']): SetLog {
  return {
    duration: type === 'duration' ? null : undefined,
    reps: (type === 'reps' || type === 'reps+weight') ? null : undefined,
    weight: type === 'reps+weight' ? null : undefined,
  }
}

export function ExerciseLogger({ config, value, onChange, prefillDate, skipped, onSkip }: Props) {
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
    <div className={`rounded-xl p-4 transition-colors ${skipped ? 'bg-slate-900 border border-slate-800' : 'bg-slate-800'}`}>
      <div className="flex items-center justify-between mb-1">
        <div className={`font-semibold ${skipped ? 'text-slate-500 line-through' : 'text-slate-100'}`}>
          {config.name}
        </div>
        <button
          onClick={onSkip}
          className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${
            skipped
              ? 'bg-slate-700 text-slate-400 hover:text-slate-200'
              : 'bg-slate-700 text-slate-400 hover:text-slate-200'
          }`}
        >
          {skipped ? 'Undo' : 'Skip'}
        </button>
      </div>

      {skipped ? (
        <div className="text-xs text-slate-600 mt-1">Not logged this session</div>
      ) : (
        <>
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
          <textarea
            value={value.comment ?? ''}
            onChange={e => onChange({ ...value, comment: e.target.value || undefined })}
            placeholder="Note (optional)"
            rows={1}
            className="mt-2 w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
          />
        </>
      )}
    </div>
  )
}
