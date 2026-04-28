# Editable Exercise Plan Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users permanently remove exercises from any session's workout plan, and re-add them later — while preserving their historical data in the dashboard.

**Architecture:** A localStorage key `plan-removed-${sessionSlug}` (string array of exercise IDs) acts as a per-session "hidden" overlay on top of the static config. Config exercises hidden this way still exist in GitHub log files so the dashboard shows them unchanged. Custom exercises can also be deleted, which removes them from both the active workout and the saved library.

**Tech Stack:** React (Next.js App Router), localStorage, TypeScript, existing `ExerciseConfig` / `ExerciseLog` types.

---

## File Map

| File | Change |
|---|---|
| `src/components/ExerciseLogger.tsx` | Add optional `onRemoveFromPlan` prop + remove button in header |
| `src/app/log/[sessionType]/LogWorkoutClient.tsx` | Manage `removedConfigIds` state, filter exercises, pass callbacks |
| `src/components/CustomExerciseAdder.tsx` | Show removed config exercises as re-add buttons; add delete (×) on saved custom exercises |

No new files. No changes to types, dashboard, or chart — historical log data is untouched.

---

## Task 1: Add remove button to ExerciseLogger

**Files:**
- Modify: `src/components/ExerciseLogger.tsx`

The component currently shows `[exercise name] [Skip]`. We extend it to `[exercise name] [Skip] [×]` when `onRemoveFromPlan` is provided. The × is subtle (slate-600) and turns red on hover so it's clearly destructive but not alarming.

- [ ] **Step 1: Add prop to interface and render the button**

Replace the entire file content with:

```tsx
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
  onRemoveFromPlan?: () => void
}

function emptySet(type: ExerciseConfig['type']): SetLog {
  return {
    duration: type === 'duration' ? null : undefined,
    reps: (type === 'reps' || type === 'reps+weight') ? null : undefined,
    weight: type === 'reps+weight' ? null : undefined,
  }
}

export function ExerciseLogger({ config, value, onChange, prefillDate, skipped, onSkip, onRemoveFromPlan }: Props) {
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
        <div className="flex items-center gap-1.5">
          <button
            onClick={onSkip}
            className="text-xs px-2.5 py-1 rounded-lg transition-colors bg-slate-700 text-slate-400 hover:text-slate-200"
          >
            {skipped ? 'Undo' : 'Skip'}
          </button>
          {onRemoveFromPlan && (
            <button
              onClick={onRemoveFromPlan}
              title="Remove from plan"
              className="text-xs px-2 py-1 rounded-lg transition-colors bg-slate-700 text-slate-600 hover:text-red-400"
            >
              ×
            </button>
          )}
        </div>
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd "training plan" && npx tsc --noEmit
```

Expected: no new errors (pre-existing `[71007]` warnings about serializable props are OK to ignore).

---

## Task 2: Manage removed-exercise state in LogWorkoutClient

**Files:**
- Modify: `src/app/log/[sessionType]/LogWorkoutClient.tsx`

Changes:
1. Load/save `plan-removed-${session.slug}` from localStorage on mount.
2. Filter config exercises by removed IDs when rendering blocks.
3. `removeConfigExercise(id)` — adds to removed set, removes from `exercises` state.
4. `reAddConfigExercise(id)` — removes from removed set, re-adds to `exercises` state (prefilled from last log).
5. `removeCustomExercise(id)` — removes from `exercises` state AND deletes from `custom-exercises-${session.slug}`.
6. Pass `removedConfigExercises` and `onReAddConfig` + `onDeleteCustom` to `CustomExerciseAdder`.
7. Pass `onRemoveFromPlan` to each `ExerciseLogger`.

- [ ] **Step 1: Add removedConfigIds state and load it on mount**

Add to the state declarations block (after the existing `useState` calls):

```tsx
const [removedConfigIds, setRemovedConfigIds] = useState<Set<string>>(new Set())
```

Add to the existing mount `useEffect` (the one that loads deload state and draft), alongside the existing lines:

```tsx
// inside the first useEffect, after setIsDeload(...)
try {
  const rawRemoved = localStorage.getItem(`plan-removed-${session.slug}`)
  if (rawRemoved) setRemovedConfigIds(new Set(JSON.parse(rawRemoved)))
} catch {}
```

- [ ] **Step 2: Add the three handler functions**

Add these after `addCustomExercise`:

```tsx
function removeConfigExercise(id: string) {
  const next = new Set(removedConfigIds)
  next.add(id)
  setRemovedConfigIds(next)
  localStorage.setItem(`plan-removed-${session.slug}`, JSON.stringify([...next]))
  setExercises(prev => prev.filter(e => e.id !== id))
}

function reAddConfigExercise(id: string) {
  const next = new Set(removedConfigIds)
  next.delete(id)
  setRemovedConfigIds(next)
  localStorage.setItem(`plan-removed-${session.slug}`, JSON.stringify([...next]))
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
```

- [ ] **Step 3: Compute removedConfigExercises array for the adder**

Add just before the `return` statement:

```tsx
const removedConfigExercises = session.blocks
  .flatMap(b => b.exercises)
  .filter(ex => removedConfigIds.has(ex.id))
```

- [ ] **Step 4: Pass onRemoveFromPlan to config exercise loggers**

In the `block.exercises.map(ex => ...)` render block, add the prop to `ExerciseLogger`:

```tsx
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
```

- [ ] **Step 5: Pass onRemoveFromPlan to custom exercise loggers**

In the `customExercises.map(ex => ...)` render block, add the prop:

```tsx
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
```

- [ ] **Step 6: Pass new props to CustomExerciseAdder**

Replace the `<CustomExerciseAdder .../>` element:

```tsx
<CustomExerciseAdder
  sessionSlug={session.slug}
  currentExerciseIds={exercises.map(e => e.id)}
  onAdd={addCustomExercise}
  removedConfigExercises={removedConfigExercises}
  onReAddConfig={reAddConfigExercise}
  onDeleteCustom={removeCustomExercise}
/>
```

- [ ] **Step 7: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: errors because `CustomExerciseAdder` doesn't accept the new props yet. Proceed to Task 3.

---

## Task 3: Update CustomExerciseAdder to show removed exercises and delete button

**Files:**
- Modify: `src/components/CustomExerciseAdder.tsx`

Changes:
1. Accept `removedConfigExercises`, `onReAddConfig`, `onDeleteCustom` props.
2. Show removed config exercises as prominent re-add buttons (above custom quick-add buttons), with a "↩" prefix and a distinct visual style so users know these are plan exercises being restored.
3. Add a × delete button on each saved custom exercise quick-add button so users can remove saved custom exercises from the library.

- [ ] **Step 1: Replace the entire file**

```tsx
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
  const hasAnything = removedConfigExercises.length > 0 || availableCustom.length > 0 || showForm

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
            <div key={ex.id} className="flex items-center bg-slate-800 border border-slate-700 rounded-lg overflow-hidden hover:border-indigo-500 transition-colors group">
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
```

- [ ] **Step 2: Verify TypeScript compiles cleanly**

```bash
npx tsc --noEmit
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ExerciseLogger.tsx \
        "src/app/log/[sessionType]/LogWorkoutClient.tsx" \
        src/components/CustomExerciseAdder.tsx

git commit -m "feat: add/remove exercises from session plan with re-add support"
```

---

## Self-Review

**Spec coverage:**
- ✅ Delete any config exercise from the workout plan
- ✅ Deleted config exercises persist (localStorage `plan-removed-${slug}`) — not re-shown unless user re-adds
- ✅ Deleted config exercises remain in dashboard stats (log files on GitHub unchanged)
- ✅ Deleted config exercises appear in bottom "Removed from plan" section with ↩ re-add button
- ✅ Newly created custom exercises can be deleted (× on quick-add buttons; × via ExerciseLogger)
- ✅ Custom exercises removed from both exercises state and saved library

**Placeholder scan:** None found — all code is complete.

**Type consistency:**
- `ExerciseConfig` imported in `CustomExerciseAdder` from `@/lib/types` ✅
- `onReAddConfig(id: string)` used consistently ✅
- `removeCustomExercise(id)` / `onDeleteCustom(id)` consistent ✅
