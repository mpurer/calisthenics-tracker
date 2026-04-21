'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { SessionConfig, WorkoutLog, ExerciseLog, SetLog } from '@/lib/types'
import { ExerciseLogger } from '@/components/ExerciseLogger'
import { StarRating } from '@/components/StarRating'
import { writeLog } from '@/lib/github'

function buildInitialExercises(session: SessionConfig, lastLog: WorkoutLog | null): ExerciseLog[] {
  return session.blocks.flatMap(block =>
    block.exercises.map(ex => {
      const previous = lastLog?.exercises.find(e => e.id === ex.id)
      if (previous && previous.sets.length > 0) {
        return { id: ex.id, name: ex.name, sets: previous.sets }
      }
      const emptySet = (): SetLog => ({
        duration: ex.type === 'duration' ? null : undefined,
        reps: (ex.type === 'reps' || ex.type === 'reps+weight') ? null : undefined,
        weight: ex.type === 'reps+weight' ? null : undefined,
      })
      return { id: ex.id, name: ex.name, sets: Array.from({ length: ex.defaultSets }, emptySet) }
    })
  )
}

interface Props {
  session: SessionConfig
  lastLog: WorkoutLog | null
  lastLogDate: string | null
}

export function LogWorkoutClient({ session, lastLog, lastLogDate }: Props) {
  const router = useRouter()
  const [exercises, setExercises] = useState<ExerciseLog[]>(() =>
    buildInitialExercises(session, lastLog)
  )
  const [rating, setRating] = useState(3)
  const [saving, setSaving] = useState(false)
  const [isDeload, setIsDeload] = useState(false)

  useEffect(() => {
    setIsDeload(localStorage.getItem('deload-week') === 'true')
  }, [])

  function updateExercise(id: string, updated: ExerciseLog) {
    setExercises(prev => prev.map(e => (e.id === id ? updated : e)))
  }

  async function save() {
    setSaving(true)
    const today = new Date().toISOString().slice(0, 10)
    const log: WorkoutLog = {
      date: today,
      sessionType: session.slug,
      isDeload,
      rating,
      exercises,
    }
    try {
      await writeLog(log)
      router.push('/')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save. Please try again.')
      setSaving(false)
    }
  }

  return (
    <main className="max-w-md mx-auto px-4 py-8">
      <div className="mb-6">
        <a href="/" className="text-sm text-slate-500 hover:text-slate-300">← Back</a>
        <h1 className="text-xl font-bold text-slate-100 mt-2">{session.displayName}</h1>
        <p className="text-sm text-slate-500">
          {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
          {isDeload && <span className="ml-2 text-xs bg-purple-700 text-purple-100 px-2 py-0.5 rounded">DELOAD</span>}
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {session.blocks.map(block => (
          <div key={block.name}>
            <h2 className="text-xs text-slate-500 uppercase tracking-wider mb-2">{block.name}</h2>
            <div className="flex flex-col gap-3">
              {block.exercises.map(ex => {
                const exerciseLog = exercises.find(e => e.id === ex.id)!
                return (
                  <ExerciseLogger
                    key={ex.id}
                    config={ex}
                    value={exerciseLog}
                    onChange={updated => updateExercise(ex.id, updated)}
                    prefillDate={lastLog?.exercises.some(e => e.id === ex.id) ? lastLogDate : null}
                  />
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <StarRating value={rating} onChange={setRating} />
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="mt-4 w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-4 rounded-xl transition-colors"
      >
        {saving ? 'Saving...' : 'Save Workout'}
      </button>
    </main>
  )
}
