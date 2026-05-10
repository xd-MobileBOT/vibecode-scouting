import { CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"

type TagToggleProps<T extends string> = {
  label: T
  selected: boolean
  onToggle: (label: T) => void
}

export function TagToggle<T extends string>({
  label,
  selected,
  onToggle,
}: TagToggleProps<T>) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background hover:bg-muted"
      )}
      onClick={() => onToggle(label)}
      aria-pressed={selected}
    >
      {selected && <CheckIcon className="size-4" />}
      {label}
    </button>
  )
}
