import { Star } from 'lucide-react'

type RatingWithScoreProps = {
  ratingAvg: number | null
  ratingCount: number | null
}

function clampRating(value: number): number {
  return Math.max(0, Math.min(5, value))
}

export function RatingWithScore({ ratingAvg, ratingCount }: RatingWithScoreProps) {
  if (ratingAvg === null || ratingCount === null || ratingCount <= 0) {
    return <p className="text-muted-foreground text-xs">No reviews yet</p>
  }

  // Round to nearest half step so stars match score text.
  const roundedRating = Math.round(clampRating(ratingAvg) * 2) / 2

  return (
    <div
      role="img"
      aria-label={`Rating ${roundedRating.toFixed(1)} out of 5, ${ratingCount} reviews`}
      className="flex items-center gap-2"
    >
      <div className="flex items-center gap-1" aria-hidden="true">
        {Array.from({ length: 5 }, (_, idx) => {
          const starFill = Math.max(0, Math.min(1, roundedRating - idx))

          return (
            <span key={idx} className="relative inline-flex h-4 w-4">
              <Star className="h-4 w-4 text-white/30" />
              {starFill > 0 ? (
                <span className="absolute inset-0 overflow-hidden" style={{ width: `${starFill * 100}%` }}>
                  <Star className="h-4 w-4 fill-amber-300 text-amber-300" />
                </span>
              ) : null}
            </span>
          )
        })}
      </div>
      <p className="text-sm text-white">
        {roundedRating.toFixed(1)} <span className="text-muted-foreground">({ratingCount})</span>
      </p>
    </div>
  )
}
