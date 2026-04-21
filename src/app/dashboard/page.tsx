import { listLogFilesServer as listLogFiles, readLogServer as readLog } from '@/lib/github-server'
import type { WorkoutLog } from '@/lib/types'
import { DashboardClient } from './DashboardClient'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  let logs: WorkoutLog[] = []

  try {
    const logFiles = await listLogFiles()
    const results = await Promise.all(logFiles.map(f => readLog(f.filename)))
    logs = results.filter((l): l is WorkoutLog => l !== null)
  } catch {
    // GitHub not configured
  }

  return <DashboardClient logs={logs} />
}
