import Link from 'next/link'

interface Props {
  slug: string
  displayName: string
  lastDoneDate: string | null
  isDeload: boolean
}

export function SessionCard({ slug, displayName, lastDoneDate, isDeload }: Props) {
  const formattedDate = lastDoneDate
    ? new Date(lastDoneDate + 'T00:00:00').toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short'
      })
    : 'Never'

  return (
    <Link
      href={`/log/${slug}`}
      className={`block w-full text-left px-4 py-4 rounded-xl transition-colors ${
        isDeload
          ? 'bg-purple-950 border border-purple-800 hover:border-purple-600'
          : 'bg-slate-800 hover:bg-slate-700'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="font-semibold text-slate-100">{displayName}</span>
        {isDeload && (
          <span className="text-xs bg-purple-700 text-purple-100 px-2 py-0.5 rounded-md">DELOAD</span>
        )}
      </div>
      <div className="text-xs text-slate-500 mt-1">Last done: {formattedDate}</div>
    </Link>
  )
}
