import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical } from "lucide-react"

import { cn } from "@/lib/utils"
import type { PickListItem } from "@/components/pick-list/pick-list-types"

type PickListCardProps = {
  item: PickListItem
  isOverlay?: boolean
}

const metrics = [
  { key: "teleopCoral", label: "Tele coral" },
  { key: "teleopCoralL4", label: "L4" },
  { key: "autoCoral", label: "Auto coral" },
  { key: "driverRating", label: "Driver" },
] as const

export function PickListCard({ item, isOverlay = false }: PickListCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.teamId,
    data: { type: "team", item },
    disabled: isOverlay,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <article
      ref={setNodeRef}
      className={cn(
        "rounded-lg border bg-background p-3 shadow-sm transition-shadow",
        isDragging && "opacity-40",
        isOverlay && "shadow-lg",
      )}
      style={style}
    >
      <div className="flex items-start gap-2">
        <button
          className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          type="button"
          aria-label={`Drag team ${item.teamNumber}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold leading-6">
                {item.teamNumber}
              </h3>
              <p className="truncate text-xs text-muted-foreground">
                {item.team?.nickname ?? "Team details unavailable"}
              </p>
            </div>
            <span
              className={cn(
                "rounded-md px-1.5 py-0.5 text-[0.7rem] font-medium",
                item.pitScouted
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {item.pitScouted ? "Pit" : "No pit"}
            </span>
          </div>

          <dl className="mt-3 grid grid-cols-2 gap-2">
            {metrics.map((metric) => (
              <div
                key={metric.key}
                className="rounded-md border bg-muted/30 px-2 py-1.5"
              >
                <dt className="truncate text-[0.7rem] text-muted-foreground">
                  {metric.label}
                </dt>
                <dd className="text-sm font-semibold">
                  {item.averages[metric.key]}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-2 flex items-center justify-between rounded-md bg-muted/40 px-2 py-1.5 text-xs">
            <span className="text-muted-foreground">Climb score</span>
            <span className="font-semibold">{item.averages.climbScore}</span>
          </div>
        </div>
      </div>
    </article>
  )
}
