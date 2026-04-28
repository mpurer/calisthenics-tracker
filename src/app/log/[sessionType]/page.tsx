import { notFound } from 'next/navigation'
import { getSession } from '@/config/training-plan'
import { listLogFilesServer as listLogFiles, readLogServer as readLog } from '@/lib/github-server'
import { getLastSessionFile } from '@/lib/logs'
import { LogWorkoutClient } from './LogWorkoutClient'

export const dynamic = 'force-dynamic'

interface Props {
  params: { sessionType: string }
}

export default async function LogWorkoutPage({ params }: Props) {
  const session = getSession(params.sessionType)
  if (!session) notFound()

  let lastLog = null
  let lastLogDate = null

  try {
    const logFiles = await listLogFiles()
    const filenames = logFiles.map(f => f.filename)
    const lastFile = getLastSessionFile(filenames, params.sessionType)
    if (lastFile) {
      lastLogDate = lastFile.date
      const data = await readLog(lastFile.filename)
      lastLog = data
    }
  } catch {
    // GitHub not yet configured
  }

  return (
    <LogWorkoutClient
      session={session}
      lastLog={lastLog}
      lastLogDate={lastLogDate}
    />
  )
}
