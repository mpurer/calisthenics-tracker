import type { WorkoutLog, LogFile, ExerciseType, SetLog } from '@/lib/types'

export function parseLogFilename(filename: string): LogFile {
  const withoutExt = filename.replace(/\.json$/, '')
  const date = withoutExt.slice(0, 10)
  // New format: YYYY-MM-DDTHHMM-slug (char 10 is 'T', time is 4 digits, then '-')
  // Old format: YYYY-MM-DD-slug (char 10 is '-')
  const sessionType = withoutExt[10] === 'T'
    ? withoutExt.slice(16)
    : withoutExt.slice(11)
  return { filename, date, sessionType }
}

export function getLastSessionDate(filenames: string[], sessionType: string): string | null {
  const matches = filenames
    .map(parseLogFilename)
    .filter(f => f.sessionType === sessionType)
    .sort((a, b) => b.filename.localeCompare(a.filename))
  return matches[0]?.date ?? null
}

export function getLastSessionFile(filenames: string[], sessionType: string): LogFile | null {
  const matches = filenames
    .map(parseLogFilename)
    .filter(f => f.sessionType === sessionType)
    .sort((a, b) => b.filename.localeCompare(a.filename))
  return matches[0] ?? null
}

export function getBestValue(
  log: WorkoutLog,
  exerciseId: string,
  type: ExerciseType,
): number | null {
  const ex = log.exercises.find(e => e.id === exerciseId)
  if (!ex || ex.sets.length === 0) return null

  if (type === 'duration') {
    const values = ex.sets.map(s => s.duration ?? 0)
    return Math.max(...values)
  }
  if (type === 'reps') {
    const values = ex.sets.map(s => s.reps ?? 0)
    return Math.max(...values)
  }
  if (type === 'reps+weight') {
    const values = ex.sets.map(s => s.weight ?? 0)
    return Math.max(...values)
  }
  return null
}

export function inferExerciseType(sets: SetLog[]): ExerciseType {
  const sample = sets[0]
  if (!sample) return 'reps'
  if ('duration' in sample) return 'duration'
  if ('weight' in sample) return 'reps+weight'
  return 'reps'
}

export function getSessionVolume(log: WorkoutLog, exerciseId: string): number | null {
  const ex = log.exercises.find(e => e.id === exerciseId)
  if (!ex || ex.sets.length === 0) return null
  const total = ex.sets.reduce((sum, s) => sum + (s.weight ?? 0) * (s.reps ?? 0), 0)
  return total || null
}

export function computeStats(values: number[]): {
  allTimeBest: number | null
  changeVsPrevious: number | null
  totalSessions: number
} {
  if (values.length === 0) return { allTimeBest: null, changeVsPrevious: null, totalSessions: 0 }

  const allTimeBest = Math.max(...values)
  const totalSessions = values.length

  let changeVsPrevious: number | null = null
  if (values.length >= 2) {
    const last = values[values.length - 1]
    const prev = values[values.length - 2]
    if (prev !== 0) {
      changeVsPrevious = Math.round(((last - prev) / prev) * 100)
    }
  }

  return { allTimeBest, changeVsPrevious, totalSessions }
}
