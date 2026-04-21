import type { WorkoutLog, LogFile } from '@/lib/types'
import { parseLogFilename } from '@/lib/logs'

const REPO = 'mpurer/calisthenics-logs'
const BASE = 'https://api.github.com'

function headers() {
  return {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

export async function listLogFilesServer(): Promise<LogFile[]> {
  const res = await fetch(`${BASE}/repos/${REPO}/contents/logs`, {
    headers: headers(),
    cache: 'no-store',
  })
  if (res.status === 404) return []
  if (!res.ok) return []
  const data = await res.json()
  if (!Array.isArray(data)) return []
  return (data as Array<{ name: string; type: string }>)
    .filter(f => f.type === 'file' && f.name.endsWith('.json'))
    .map(f => parseLogFilename(f.name))
    .sort((a, b) => b.date.localeCompare(a.date))
}

export async function readLogServer(filename: string): Promise<WorkoutLog | null> {
  const res = await fetch(`${BASE}/repos/${REPO}/contents/logs/${filename}`, {
    headers: headers(),
    cache: 'no-store',
  })
  if (!res.ok) return null
  const data = await res.json() as { content: string }
  return JSON.parse(Buffer.from(data.content, 'base64').toString('utf8'))
}
