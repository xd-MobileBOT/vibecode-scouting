import { cn } from "@/lib/utils"

type RatingControlProps = {
  label: string
  value: number
  onChange: (value: number) => void
}

export function RatingControl({ label, value, onChange }: RatingControlProps) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium text-foreground">{label}</legend>
      <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
        {Array.from({ length: 10 }, (_, index) => {
          const rating = index + 1
          return (
            <button
              key={rating}
              type="button"
              className={cn(
                "grid h-11 place-items-center rounded-lg border text-sm font-semibold tabular-nums transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                value === rating
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:bg-muted"
              )}
              onClick={() => onChange(rating)}
            >
              {rating}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
