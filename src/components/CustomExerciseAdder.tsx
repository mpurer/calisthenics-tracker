'use client'

import { useState, useEffect } from 'react'
import type { ExerciseType, CustomExercise } from '@/lib/types'

interface Props {
  sessionSlug: string
  currentExerciseIds: string[]
  onAdd: (exercise: CustomExercise) => void
}

const TYPE_LABELS: Record<ExerciseType, string> = {
  reps: 'Reps',
  duration: 'Seconds',
  'reps+weight': 'Reps + kg',
}

export function CustomExerciseAdder({ sessionSlug, currentExerciseIds, onAdd }: Props) {
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

  function handleQuickAdd(exercise: CustomExercise) {
    onAdd(exercise)
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

  const available = saved.filter(s => !currentExerciseIds.includes(s.id))

  return (
    <div>
      <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Custom Exercises</p>

      {available.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {available.map(ex => (
            <button
              key={ex.id}
              onClick={() => handleQuickAdd(ex)}
              className="text-xs bg-slate-800 text-slate-300 border border-slate-700 rounded-lg px-3 py-1.5 hover:border-indigo-500 hover:text-white transition-colors"
            >
              + {ex.name}
              <span className="ml-1.5 text-slate-500">{TYPE_LABELS[ex.type]}</span>
            </button>
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
