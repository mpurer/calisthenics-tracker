import { parseLogFilename, getLastSessionDate, getLastSessionFile, getBestValue, getSessionVolume, computeStats } from '@/lib/logs'
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
  it('parses date and sessionType from old format filename', () => {
    expect(parseLogFilename('2026-04-21-planche-oahs.json')).toEqual({
      filename: '2026-04-21-planche-oahs.json',
      date: '2026-04-21',
      sessionType: 'planche-oahs',
    })
  })

  it('parses date and sessionType from timestamp format filename', () => {
    expect(parseLogFilename('2026-04-21T1430-planche-oahs.json')).toEqual({
      filename: '2026-04-21T1430-planche-oahs.json',
      date: '2026-04-21',
      sessionType: 'planche-oahs',
    })
  })

  it('handles multi-segment session slugs (old format)', () => {
    expect(parseLogFilename('2026-04-23-pull-fl-oahs.json')).toEqual({
      filename: '2026-04-23-pull-fl-oahs.json',
      date: '2026-04-23',
      sessionType: 'pull-fl-oahs',
    })
  })

  it('handles multi-segment session slugs (timestamp format)', () => {
    expect(parseLogFilename('2026-04-23T0900-pull-fl-oahs.json')).toEqual({
      filename: '2026-04-23T0900-pull-fl-oahs.json',
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

describe('getLastSessionFile', () => {
  it('returns the most recent LogFile for a sessionType', () => {
    const filenames = [
      '2026-04-17-planche-oahs.json',
      '2026-04-21T1430-planche-oahs.json',
      '2026-04-21T0900-planche-oahs.json',
    ]
    const result = getLastSessionFile(filenames, 'planche-oahs')
    expect(result).toEqual({
      filename: '2026-04-21T1430-planche-oahs.json',
      date: '2026-04-21',
      sessionType: 'planche-oahs',
    })
  })

  it('returns null if no sessions exist for that type', () => {
    expect(getLastSessionFile(['2026-04-21-planche-oahs.json'], 'oahs-hspu')).toBeNull()
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

describe('getSessionVolume', () => {
  it('returns sum of weight × reps across all sets', () => {
    const log = makeLog({
      exercises: [{
        id: 'weighted-dips',
        name: 'Weighted dips',
        sets: [{ reps: 6, weight: 10 }, { reps: 5, weight: 12 }, { reps: 4, weight: 12 }],
      }],
    })
    // 6×10 + 5×12 + 4×12 = 60 + 60 + 48 = 168
    expect(getSessionVolume(log, 'weighted-dips')).toBe(168)
  })

  it('returns null if exercise not in log', () => {
    expect(getSessionVolume(makeLog(), 'nonexistent')).toBeNull()
  })

  it('returns null if all sets have zero volume', () => {
    const log = makeLog({
      exercises: [{
        id: 'weighted-dips',
        name: 'Weighted dips',
        sets: [{ reps: 0, weight: 0 }],
      }],
    })
    expect(getSessionVolume(log, 'weighted-dips')).toBeNull()
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
