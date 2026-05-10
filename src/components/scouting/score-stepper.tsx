import { MinusIcon, PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ScoreStepperProps = {
  label: string
  value: number
  onChange: (value: number) => void
  className?: string
}

export function ScoreStepper({
  label,
  value,
  onChange,
  className,
}: ScoreStepperProps) {
  const decrease = () => onChange(Math.max(0, value - 1))
  const increase = () => onChange(Math.min(99, value + 1))

  return (
    <div
      className={cn(
        "grid grid-cols-[1fr_auto] items-center gap-3 rounded-lg border bg-background p-3",
        className
      )}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">Count</p>
      </div>
      <div className="grid grid-cols-[2.75rem_3rem_2.75rem] items-center overflow-hidden rounded-lg border">
        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          className="h-11 rounded-none"
          onClick={decrease}
          disabled={value <= 0}
        >
          <MinusIcon />
          <span className="sr-only">Decrease {label}</span>
        </Button>
        <output className="grid h-11 place-items-center border-x text-lg font-semibold tabular-nums">
          {value}
        </output>
        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          className="h-11 rounded-none"
          onClick={increase}
        >
          <PlusIcon />
          <span className="sr-only">Increase {label}</span>
        </Button>
      </div>
    </div>
  )
}
