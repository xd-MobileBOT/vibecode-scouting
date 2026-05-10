import type * as React from "react"
import { CheckCircle2Icon, CircleIcon, LockIcon } from "lucide-react"

import { cn } from "@/lib/utils"

type StatusPillProps = {
  tone: "complete" | "open" | "locked"
  children: React.ReactNode
}

const toneClasses = {
  complete: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  open: "border-border bg-muted text-muted-foreground",
  locked: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
}

const icons = {
  complete: CheckCircle2Icon,
  open: CircleIcon,
  locked: LockIcon,
}

export function StatusPill({ tone, children }: StatusPillProps) {
  const Icon = icons[tone]

  return (
    <span
      className={cn(
        "inline-flex min-h-8 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium",
        toneClasses[tone]
      )}
    >
      <Icon className="size-3.5" />
      {children}
    </span>
  )
}
