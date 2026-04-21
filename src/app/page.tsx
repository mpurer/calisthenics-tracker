import Link from 'next/link'
import { listLogFilesServer as listLogFiles } from '@/lib/github-server'
import { DeloadToggle } from '@/components/DeloadToggle'
import { SessionList } from '@/components/SessionList'

export const dynamic = 'force-dynamic'

export default async function Home() {
  let logFiles: import('@/lib/types').LogFile[] = []
  try {
    logFiles = await listLogFiles()
  } catch {
    // GitHub not yet configured
  }

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  })

  return (
    <main className="max-w-md mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Training</h1>
        <p className="text-sm text-slate-500 mt-1">{today}</p>
      </div>

      <div className="mb-4">
        <DeloadToggle />
      </div>

      <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">What are you training today?</p>

      <SessionList logFiles={logFiles} />

      <div className="mt-8 text-center">
        <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
          📊 Progress Dashboard
        </Link>
      </div>
    </main>
  )
}
