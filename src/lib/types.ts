export type ExerciseType = 'duration' | 'reps' | 'reps+weight'

export interface ExerciseConfig {
  id: string
  name: string
  type: ExerciseType
  defaultSets: number
}

export interface BlockConfig {
  name: string
  exercises: ExerciseConfig[]
}

export interface SessionConfig {
  slug: string
  displayName: string
  blocks: BlockConfig[]
}

export interface SetLog {
  duration?: number | null
  reps?: number | null
  weight?: number | null
}

export interface ExerciseLog {
  id: string
  name: string
  sets: SetLog[]
  comment?: string
}

export interface WorkoutLog {
  date: string            // YYYY-MM-DD
  sessionType: string     // matches SessionConfig.slug
  isDeload: boolean
  rating: number          // 1–5
  exercises: ExerciseLog[]
}

export interface CustomExercise {
  id: string
  name: string
  type: ExerciseType
}

export interface LogFile {
  filename: string        // e.g. "2026-04-21-planche-oahs.json"
  date: string            // YYYY-MM-DD
  sessionType: string
}
