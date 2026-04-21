'use client'

import { SESSIONS } from '@/config/training-plan'
import { SessionCard } from '@/components/SessionCard'
import { useIsDeload } from '@/components/DeloadToggle'
import type { LogFile } from '@/lib/types'
import { getLastSessionDate } from '@/lib/logs'

interface Props {
  logFiles: LogFile[]
}

export function SessionList({ logFiles }: Props) {
  const isDeload = useIsDeload()
  const filenames = logFiles.map(f => f.filename)

  return (
    <div className="flex flex-col gap-3">
      {SESSIONS.map(session => (
        <SessionCard
          key={session.slug}
          slug={session.slug}
          displayName={session.displayName}
          lastDoneDate={getLastSessionDate(filenames, session.slug)}
          isDeload={isDeload}
        />
      ))}
    </div>
  )
}
