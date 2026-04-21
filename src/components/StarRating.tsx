'use client'

interface Props {
  value: number
  onChange: (rating: number) => void
}

export function StarRating({ value, onChange }: Props) {
  return (
    <div className="bg-slate-800 rounded-xl p-4 text-center">
      <div className="text-xs text-slate-400 mb-2">How did the session feel?</div>
      <div className="flex justify-center gap-2">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            onClick={() => onChange(star)}
            className={`text-3xl transition-transform active:scale-90 ${
              star <= value ? 'text-yellow-400' : 'text-slate-600'
            }`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  )
}
