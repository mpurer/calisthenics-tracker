'use client'

import { useEffect, useState } from 'react'

const KEY = 'deload-week'

export function DeloadToggle() {
  const [isDeload, setIsDeload] = useState(false)

  useEffect(() => {
    setIsDeload(localStorage.getItem(KEY) === 'true')
  }, [])

  function toggle() {
    const next = !isDeload
    setIsDeload(next)
    localStorage.setItem(KEY, String(next))
  }

  return (
    <button
      onClick={toggle}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-colors ${
        isDeload
          ? 'bg-purple-950 border border-purple-700 text-purple-200'
          : 'bg-slate-800 text-slate-400'
      }`}
    >
      <span>Deload week</span>
      <div className={`w-10 h-6 rounded-full relative transition-colors ${isDeload ? 'bg-purple-600' : 'bg-slate-600'}`}>
        <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${isDeload ? 'right-0.5' : 'left-0.5'}`} />
      </div>
    </button>
  )
}

export function useIsDeload(): boolean {
  const [isDeload, setIsDeload] = useState(false)
  useEffect(() => {
    setIsDeload(localStorage.getItem(KEY) === 'true')
  }, [])
  return isDeload
}
