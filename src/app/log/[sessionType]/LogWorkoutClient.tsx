'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { SessionConfig, WorkoutLog, ExerciseLog, SetLog, CustomExercise, ExerciseType } from '@/lib/types'
import { ExerciseLogger } from '@/components/ExerciseLogger'
import { StarRating } from '@/components/StarRating'
import { CustomExerciseAdder } from '@/components/CustomExerciseAdder'
import { writeLog } from '@/lib/github'

function emptySetForType(type: ExerciseType): SetLog {
  return {
    duration: type === 'duration' ? null : undefined,
    reps: (type === 'reps' || type === 'reps+weight') ? null : undefined,
    weight: type === 'reps+weight' ? null : undefined,
  }
}

function buildInitialExercises(session: SessionConfig, lastLog: WorkoutLog | null): ExerciseLog[] {
  return session.blocks.flatMap(block =>
    block.exercises.map(ex => {
      const previous = lastLog?.exercises.find(e => e.id === ex.id)
      if (previous && previous.sets.length > 0) {
        return { id: ex.id, name: ex.name, sets: previous.sets }
      }
      return { id: ex.id, name: ex.name, sets: Array.from({ length: ex.defaultSets }, () => emptySetForType(ex.type)) }
    })
  )
}

interface Props {
  session: SessionConfig
  lastLog: WorkoutLog | null
  lastLogDate: string | null
}

interface Draft {
  date: string
  exercises: ExerciseLog[]
  skippedIds: string[]
  rating: number
}

export function LogWorkoutClient({ session, lastLog, lastLogDate }: Props) {
  const router = useRouter()
  const draftKey = `workout-draft-${session.slug}`
  const today = new Date().toISOString().slice(0, 10)

  const [exercises, setExercises] = useState<ExerciseLog[]>(() =>
    buildInitialExercises(session, lastLog)
  )
  const [skippedIds, setSkippedIds] = useState<Set<string>>(new Set())
  const [rating, setRating] = useState(3)
  const [saving, setSaving] = useState(false)
  const [isDeload, setIsDeload] = useState(false)
  const [draftRestored, setDraftRestored] = useState(false)
  const [removedConfigIds, setRemovedConfigIds] = useState<Set<string>>(new Set())

  // Restore draft and deload state on mount
  useEffect(() => {
    setIsDeload(localStorage.getItem('deload-week') === 'true')

    try {
      const rawRemoved = localStorage.getItem(`plan-removed-${session.slug}`)
      if (rawRemoved) setRemovedConfigIds(new Set(JSON.parse(rawRemoved)))
    } catch {}

    try {
      const raw = localStorage.getItem(draftKey)
      if (raw) {
        const draft: Draft = JSON.parse(raw)
        if (draft.date === today) {
          setExercises(draft.exercises)
          setSkippedIds(new Set(draft.skippedIds))
          setRating(draft.rating)
          setDraftRestored(true)
        }
      }
    } catch {
      // corrupt draft — ignore
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Persist draft on every change
  useEffect(() => {
    const draft: Draft = {
      date: today,
      exercises,
      skippedIds: Array.from(skippedIds),
      rating,
    }
    localStorage.setItem(draftKey, JSON.stringify(draft))
  }, [exercises, skippedIds, rating]) // eslint-disable-line react-hooks/exhaustive-deps

  function updateExercise(id: string, updated: ExerciseLog) {
    setExercises(prev => prev.map(e => (e.id === id ? updated : e)))
  }

  function toggleSkip(id: string) {
    setSkippedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function addCustomExercise(custom: CustomExercise) {
    setExercises(prev => {
      if (prev.some(e => e.id === custom.id)) return prev
      // Prefill from lastLog if this exercise was logged before
      const previous = lastLog?.exercises.find(e => e.id === custom.id)
      const sets = previous?.sets.length
        ? previous.sets
        : Array.from({ length: 3 }, () => emptySetForType(custom.type))
      return [...prev, { id: custom.id, name: custom.name, sets }]
    })
  }

  function removeConfigExercise(id: string) {
    setRemovedConfigIds(prev => {
      const next = new Set(prev)
      next.add(id)
      localStorage.setItem(`plan-removed-${session.slug}`, JSON.stringify(Array.from(next)))
      return next
    })
    setExercises(prev => prev.filter(e => e.id !== id))
  }

  function reAddConfigExercise(id: string) {
    setRemovedConfigIds(prev => {
      const next = new Set(prev)
      next.delete(id)
      localStorage.setItem(`plan-removed-${session.slug}`, JSON.stringify(Array.from(next)))
      return next
    })
    const ex = session.blocks.flatMap(b => b.exercises).find(e => e.id === id)
    if (!ex) return
    const previous = lastLog?.exercises.find(e => e.id === id)
    const sets = previous?.sets.length
      ? previous.sets
      : Array.from({ length: ex.defaultSets }, () => emptySetForType(ex.type))
    setExercises(prev => [...prev, { id: ex.id, name: ex.name, sets }])
  }

  function removeCustomExercise(id: string) {
    setExercises(prev => prev.filter(e => e.id !== id))
    const storageKey = `custom-exercises-${session.slug}`
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const saved = (JSON.parse(raw) as CustomExercise[]).filter(e => e.id !== id)
        localStorage.setItem(storageKey, JSON.stringify(saved))
      }
    } catch {}
  }

  async function save() {
    setSaving(true)
    const log: WorkoutLog = {
      date: today,
      sessionType: session.slug,
      isDeload,
      rating,
      exercises: exercises.filter(e => !skippedIds.has(e.id)),
    }
    try {
      await writeLog(log)
      localStorage.removeItem(draftKey)
      localStorage.removeItem(`plan-removed-${session.slug}`)
      router.push('/')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save. Please try again.')
      setSaving(false)
    }
  }

  // IDs of all exercises in the session config (not custom)
  const configExerciseIds = session.blocks.flatMap(b => b.exercises.map(e => e.id))
  const customExercises = exercises.filter(e => !configExerciseIds.includes(e.id))

  const removedConfigExercises = session.blocks
    .flatMap(b => b.exercises)
    .filter(ex => removedConfigIds.has(ex.id))

  return (
    <main className="max-w-md mx-auto px-4 py-8">
      <div className="mb-6">
        <a href="/" className="text-sm text-slate-500 hover:text-slate-300">← Back</a>
        <h1 className="text-xl font-bold text-slate-100 mt-2">{session.displayName}</h1>
        <p className="text-sm text-slate-500">
          {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
          {isDeload && <span className="ml-2 text-xs bg-purple-700 text-purple-100 px-2 py-0.5 rounded">DELOAD</span>}
        </p>
        {draftRestored && (
          <p className="text-xs text-indigo-400 mt-1">⟳ Draft restored from earlier today</p>
        )}
      </div>

      <div className="flex flex-col gap-6">
        {session.blocks.map(block => (
          <div key={block.name}>
            <h2 className="text-xs text-slate-500 uppercase tracking-wider mb-2">{block.name}</h2>
            <div className="flex flex-col gap-3">
              {block.exercises.filter(ex => !removedConfigIds.has(ex.id)).map(ex => {
                const exerciseLog = exercises.find(e => e.id === ex.id)!
                return (
                  <ExerciseLogger
                    key={ex.id}
                    config={ex}
                    value={exerciseLog}
                    onChange={updated => updateExercise(ex.id, updated)}
                    prefillDate={lastLog?.exercises.some(e => e.id === ex.id) ? lastLogDate : null}
                    skipped={skippedIds.has(ex.id)}
                    onSkip={() => toggleSkip(ex.id)}
                    onRemoveFromPlan={() => removeConfigExercise(ex.id)}
                  />
                )
              })}
            </div>
          </div>
        ))}

        {/* Custom exercises added this session */}
        {customExercises.length > 0 && (
          <div>
            <h2 className="text-xs text-slate-500 uppercase tracking-wider mb-2">Custom</h2>
            <div className="flex flex-col gap-3">
              {customExercises.map(ex => {
                // Infer config-like object from the exercise log
                const type = (ex.sets[0]?.weight !== undefined)
                  ? 'reps+weight' as const
                  : (ex.sets[0]?.duration !== undefined)
                  ? 'duration' as const
                  : 'reps' as const
                return (
                  <ExerciseLogger
                    key={ex.id}
                    config={{ id: ex.id, name: ex.name, type, defaultSets: 3 }}
                    value={ex}
                    onChange={updated => updateExercise(ex.id, updated)}
                    prefillDate={lastLog?.exercises.some(e => e.id === ex.id) ? lastLogDate : null}
                    skipped={skippedIds.has(ex.id)}
                    onSkip={() => toggleSkip(ex.id)}
                    onRemoveFromPlan={() => removeCustomExercise(ex.id)}
                  />
                )
              })}
            </div>
          </div>
        )}

        <CustomExerciseAdder
          sessionSlug={session.slug}
          currentExerciseIds={exercises.map(e => e.id)}
          onAdd={addCustomExercise}
          removedConfigExercises={removedConfigExercises}
          onReAddConfig={reAddConfigExercise}
          onDeleteCustom={removeCustomExercise}
        />
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
