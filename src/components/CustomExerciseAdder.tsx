'use client'

import { useState, useEffect } from 'react'
import type { ExerciseType, CustomExercise, ExerciseConfig } from '@/lib/types'

interface Props {
  sessionSlug: string
  currentExerciseIds: string[]
  onAdd: (exercise: CustomExercise) => void
  removedConfigExercises?: ExerciseConfig[]
  onReAddConfig?: (id: string) => void
  onDeleteCustom?: (id: string) => void
}

const TYPE_LABELS: Record<ExerciseType, string> = {
  reps: 'Reps',
  duration: 'Seconds',
  'reps+weight': 'Reps + kg',
}

export function CustomExerciseAdder({
  sessionSlug,
  currentExerciseIds,
  onAdd,
  removedConfigExercises = [],
  onReAddConfig,
  onDeleteCustom,
}: Props) {
  const storageKey = `custom-exercises-${sessionSlug}`
  const [saved, setSaved] = useState<CustomExercise[]>([])
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState<ExerciseType>('reps')

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) setSaved(JSON.parse(raw))
    } catch {}
  }, [storageKey])

  function persist(exercises: CustomExercise[]) {
    localStorage.setItem(storageKey, JSON.stringify(exercises))
    setSaved(exercises)
  }

  function handleDeleteCustom(id: string) {
    persist(saved.filter(s => s.id !== id))
    onDeleteCustom?.(id)
  }

  function handleNewExercise() {
    const trimmed = name.trim()
    if (!trimmed) return

    const id = `custom-${sessionSlug}-${trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
    const exercise: CustomExercise = { id, name: trimmed, type }

    persist(saved.some(s => s.id === id)
      ? saved.map(s => s.id === id ? exercise : s)
      : [...saved, exercise]
    )

    onAdd(exercise)
    setName('')
    setType('reps')
    setShowForm(false)
  }

  const availableCustom = saved.filter(s => !currentExerciseIds.includes(s.id))

  return (
    <div>
      <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Exercises</p>

      {removedConfigExercises.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-slate-600 mb-2">Removed from plan</p>
          <div className="flex flex-wrap gap-2">
            {removedConfigExercises.map(ex => (
              <button
                key={ex.id}
                onClick={() => onReAddConfig?.(ex.id)}
                className="text-xs bg-slate-800 text-slate-400 border border-slate-700 rounded-lg px-3 py-1.5 hover:border-indigo-500 hover:text-white transition-colors"
              >
                ↩ {ex.name}
                <span className="ml-1.5 text-slate-600">{TYPE_LABELS[ex.type]}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {availableCustom.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {availableCustom.map(ex => (
            <div key={ex.id} className="flex items-center bg-slate-800 border border-slate-700 rounded-lg overflow-hidden hover:border-indigo-500 transition-colors">
              <button
                onClick={() => onAdd(ex)}
                className="text-xs text-slate-300 px-3 py-1.5 hover:text-white transition-colors"
              >
                + {ex.name}
                <span className="ml-1.5 text-slate-500">{TYPE_LABELS[ex.type]}</span>
              </button>
              <button
                onClick={() => handleDeleteCustom(ex.id)}
                title="Delete from library"
                className="text-slate-700 hover:text-red-400 px-2 py-1.5 transition-colors text-xs border-l border-slate-700"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {showForm ? (
        <div className="bg-slate-800 rounded-xl p-4">
          <input
            type="text"
            placeholder="Exercise name"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleNewExercise()}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 mb-3"
            autoFocus
          />
          <div className="flex gap-2 mb-3">
            {(['reps', 'duration', 'reps+weight'] as ExerciseType[]).map(t => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                  type === t ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                {TYPE_LABELS[t]}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleNewExercise}
              disabled={!name.trim()}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
            >
              Add exercise
            </button>
            <button
              onClick={() => { setShowForm(false); setName('') }}
              className="px-4 bg-slate-700 text-slate-400 text-sm rounded-lg hover:text-slate-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="text-xs text-slate-400 hover:text-slate-200 bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-lg px-3 py-1.5 transition-colors"
        >
          + New custom exercise
        </button>
      )}
    </div>
  )
}
