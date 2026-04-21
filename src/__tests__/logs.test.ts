import { parseLogFilename, getLastSessionDate, getBestValue, computeStats } from '@/lib/logs'
import type { WorkoutLog } from '@/lib/types'

const makeLog = (overrides: Partial<WorkoutLog> = {}): WorkoutLog => ({
  date: '2026-04-21',
  sessionType: 'planche-oahs',
  isDeload: false,
  rating: 4,
  exercises: [],
  ...overrides,
})

describe('parseLogFilename', () => {
  it('parses date and sessionType from filename', () => {
    expect(parseLogFilename('2026-04-21-planche-oahs.json')).toEqual({
      filename: '2026-04-21-planche-oahs.json',
      date: '2026-04-21',
      sessionType: 'planche-oahs',
    })
  })

  it('handles multi-segment session slugs', () => {
    expect(parseLogFilename('2026-04-23-pull-fl-oahs.json')).toEqual({
      filename: '2026-04-23-pull-fl-oahs.json',
      date: '2026-04-23',
      sessionType: 'pull-fl-oahs',
    })
  })
})

describe('getLastSessionDate', () => {
  const filenames = [
    '2026-04-17-planche-oahs.json',
    '2026-04-18-pull-fl-oahs.json',
    '2026-04-21-planche-oahs.json',
  ]

  it('returns the most recent date for a sessionType', () => {
    expect(getLastSessionDate(filenames, 'planche-oahs')).toBe('2026-04-21')
  })

  it('returns null if no sessions exist for that type', () => {
    expect(getLastSessionDate(filenames, 'oahs-hspu')).toBeNull()
  })
})

describe('getBestValue', () => {
  it('returns longest duration for duration exercises', () => {
    const log = makeLog({
      exercises: [{
        id: 'advanced-tuck-planche',
        name: 'Advanced tuck planche',
        sets: [{ duration: 7 }, { duration: 9 }, { duration: 8 }],
      }],
    })
    expect(getBestValue(log, 'advanced-tuck-planche', 'duration')).toBe(9)
  })

  it('returns max reps for rep exercises', () => {
    const log = makeLog({
      exercises: [{
        id: 'pseudo-planche-pushups',
        name: 'Pseudo planche push-ups',
        sets: [{ reps: 8 }, { reps: 10 }, { reps: 7 }],
      }],
    })
    expect(getBestValue(log, 'pseudo-planche-pushups', 'reps')).toBe(10)
  })

  it('returns highest weight for reps+weight exercises', () => {
    const log = makeLog({
      exercises: [{
        id: 'weighted-dips',
        name: 'Weighted dips',
        sets: [{ reps: 6, weight: 10 }, { reps: 5, weight: 12 }],
      }],
    })
    expect(getBestValue(log, 'weighted-dips', 'reps+weight')).toBe(12)
  })

  it('returns null if exercise not in log', () => {
    expect(getBestValue(makeLog(), 'nonexistent', 'reps')).toBeNull()
  })
})

describe('computeStats', () => {
  it('returns allTimeBest, changeVsPrevious, and totalSessions', () => {
    const values = [5, 7, 6, 8]
    expect(computeStats(values)).toEqual({
      allTimeBest: 8,
      changeVsPrevious: 33,  // (8 - 6) / 6 * 100, rounded
      totalSessions: 4,
    })
  })

  it('returns null changeVsPrevious with only one session', () => {
    expect(computeStats([7])).toEqual({
      allTimeBest: 7,
      changeVsPrevious: null,
      totalSessions: 1,
    })
  })

  it('returns zeroed stats for empty array', () => {
    expect(computeStats([])).toEqual({
      allTimeBest: null,
      changeVsPrevious: null,
      totalSessions: 0,
    })
  })
})
