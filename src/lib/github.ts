import type { WorkoutLog, LogFile } from '@/lib/types'
import { parseLogFilename } from '@/lib/logs'

const API = '/api/github'

export async function listLogFiles(): Promise<LogFile[]> {
  const res = await fetch(`${API}?action=list`)
  const filenames: string[] = await res.json()
  return filenames.map(parseLogFilename).sort((a, b) => b.date.localeCompare(a.date))
}

export async function readLog(filename: string): Promise<WorkoutLog | null> {
  const res = await fetch(`${API}?action=read&path=logs/${filename}`)
  const data = await res.json()
  return data?.content ?? null
}

export async function writeLog(log: WorkoutLog): Promise<void> {
  const filename = `${log.date}-${log.sessionType}.json`
  await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: `logs/${filename}`, content: log }),
  })
}
