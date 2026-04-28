import type { WorkoutLog, LogFile } from '@/lib/types'
import { parseLogFilename } from '@/lib/logs'

const API = '/api/github'

export async function listLogFiles(): Promise<LogFile[]> {
  const res = await fetch(`${API}?action=list`)
  if (!res.ok) return []
  const data = await res.json()
  if (!Array.isArray(data)) return []
  return (data as string[]).map(parseLogFilename).sort((a, b) => b.date.localeCompare(a.date))
}

export async function readLog(filename: string): Promise<WorkoutLog | null> {
  const res = await fetch(`${API}?action=read&path=logs/${filename}`)
  if (!res.ok) return null
  const data = await res.json()
  return data?.content ?? null
}

export async function writeLog(log: WorkoutLog): Promise<void> {
  const now = new Date()
  const hhmm = now.getHours().toString().padStart(2, '0') + now.getMinutes().toString().padStart(2, '0')
  const filename = `${log.date}T${hhmm}-${log.sessionType}.json`
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: `logs/${filename}`, content: log }),
  })
  if (!res.ok) {
    throw new Error('Failed to save workout. Please try again.')
  }
}
