import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { useMutation, useQuery } from "convex/react"
import { Loader2, Plus } from "lucide-react"
import { useMemo, useState, type FormEvent } from "react"
import { toast } from "sonner"

import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"
import { PickListCard } from "@/components/pick-list/pick-list-card"
import type {
  PickListColumnData,
  PickListItem,
} from "@/components/pick-list/pick-list-types"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { pickTiers, type PickTier } from "@/lib/scouting-contract"
import { cn } from "@/lib/utils"

type PickListSummary = {
  _id: Id<"pickLists">
  name: string
  type: "primary" | "personal"
  updatedAt: number
}

type PickListBoardProps = {
  isAdmin: boolean
  list: PickListSummary | null
  pickListId: Id<"pickLists"> | null
}

type AvailableTeamId = Id<"teams">

export function PickListBoard({
  isAdmin,
  list,
  pickListId,
}: PickListBoardProps) {
  const board = useQuery(
    api.pickLists.board,
    pickListId ? { pickListId } : "skip",
  )
  const moveTeam = useMutation(api.pickLists.moveTeam)
  const addTeamToPrimary = useMutation(api.pickLists.addTeamToPrimary)

  const [optimisticColumns, setOptimisticColumns] = useState<
    PickListColumnData[] | null
  >(null)
  const [optimisticPickListId, setOptimisticPickListId] =
    useState<Id<"pickLists"> | null>(null)
  const [activeItem, setActiveItem] = useState<PickListItem | null>(null)
  const [selectedTeamId, setSelectedTeamId] = useState<AvailableTeamId | "">("")
  const [isAddingTeam, setIsAddingTeam] = useState(false)
  const [isSavingMove, setIsSavingMove] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 140, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const sourceColumns = useMemo(
    () =>
      optimisticPickListId === pickListId && optimisticColumns
        ? optimisticColumns
        : (board?.columns ?? []),
    [board?.columns, optimisticColumns, optimisticPickListId, pickListId],
  )

  const orderedColumns = useMemo(
    () =>
      pickTiers.map((tier) => {
        return (
          sourceColumns.find((column) => column.tier === tier.value) ?? {
            tier: tier.value,
            label: tier.label,
            items: [],
          }
        )
      }),
    [sourceColumns],
  )

  if (!list || !pickListId) {
    return (
      <div className="flex min-h-[24rem] items-center justify-center rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
        <div className="max-w-sm text-center">
          <h2 className="text-lg font-semibold">No board selected</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Create a personal pick list or choose an existing board.
          </p>
        </div>
      </div>
    )
  }

  if (board === undefined) {
    return (
      <div className="flex min-h-[24rem] items-center justify-center rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (board === null) {
    return (
      <div className="flex min-h-[24rem] items-center justify-center rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
        <div className="max-w-sm text-center">
          <h2 className="text-lg font-semibold">Board unavailable</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            This pick list could not be loaded for your account.
          </p>
        </div>
      </div>
    )
  }

  const boardData = board
  const currentPickListId = pickListId
  const isPrimary = list.type === "primary"
  const canEdit = list.type === "personal" || (isPrimary && isAdmin)

  function findItem(teamId: string, sourceColumns = orderedColumns) {
    for (const column of sourceColumns) {
      const item = column.items.find((candidate) => candidate.teamId === teamId)
      if (item) {
        return item
      }
    }
    return null
  }

  function findColumn(tier: PickTier, sourceColumns = orderedColumns) {
    return sourceColumns.find((column) => column.tier === tier)
  }

  async function persistAffectedColumns(
    nextColumns: PickListColumnData[],
    affectedTiers: Set<PickTier>,
  ) {
    const updates = nextColumns
      .filter((column) => affectedTiers.has(column.tier))
      .flatMap((column) =>
        column.items.map((item, index) =>
          moveTeam({
            pickListId: currentPickListId,
            teamId: item.teamId,
            tier: column.tier,
            order: index,
          }),
        ),
      )

    await Promise.all(updates)
  }

  function normalizeColumns(nextColumns: PickListColumnData[]) {
    return nextColumns.map((column) => ({
      ...column,
      items: column.items.map((item, index) => ({
        ...item,
        tier: column.tier,
        order: index,
      })),
    }))
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveItem(findItem(String(event.active.id)))
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveItem(null)

    if (!canEdit || !event.over) {
      return
    }

    const draggedItem = findItem(String(event.active.id))
    if (!draggedItem) {
      return
    }

    const overData = event.over.data.current
    const sourceTier = draggedItem.tier
    const sourceColumn = findColumn(sourceTier)
    if (!sourceColumn) {
      return
    }

    let targetTier: PickTier | null = null
    let targetIndex = 0

    if (overData?.type === "column") {
      targetTier = overData.tier as PickTier
      targetIndex = findColumn(targetTier)?.items.length ?? 0
    } else {
      const overItem = findItem(String(event.over.id))
      if (!overItem) {
        return
      }
      targetTier = overItem.tier
      targetIndex =
        findColumn(targetTier)?.items.findIndex(
          (item) => item.teamId === overItem.teamId,
        ) ?? 0
    }

    if (!targetTier) {
      return
    }

    const sourceIndex = sourceColumn.items.findIndex(
      (item) => item.teamId === draggedItem.teamId,
    )
    if (sourceIndex < 0 || (sourceTier === targetTier && sourceIndex === targetIndex)) {
      return
    }

    const nextColumns = orderedColumns.map((column) => {
      if (sourceTier === targetTier && column.tier === sourceTier) {
        return {
          ...column,
          items: arrayMove(column.items, sourceIndex, targetIndex),
        }
      }

      if (column.tier === sourceTier) {
        return {
          ...column,
          items: column.items.filter((item) => item.teamId !== draggedItem.teamId),
        }
      }

      if (column.tier === targetTier) {
        const nextItems = [...column.items]
        nextItems.splice(targetIndex, 0, draggedItem)
        return { ...column, items: nextItems }
      }

      return column
    })

    const normalizedColumns = normalizeColumns(nextColumns)
    const affectedTiers = new Set<PickTier>([sourceTier, targetTier])

    setOptimisticPickListId(currentPickListId)
    setOptimisticColumns(normalizedColumns)
    setIsSavingMove(true)

    try {
      await persistAffectedColumns(normalizedColumns, affectedTiers)
    } catch (error) {
      setOptimisticPickListId(currentPickListId)
      setOptimisticColumns(boardData.columns)
      toast.error(error instanceof Error ? error.message : "Could not move team")
    } finally {
      setIsSavingMove(false)
    }
  }

  async function handleAddTeamToPrimary(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedTeamId) {
      return
    }

    setIsAddingTeam(true)
    try {
      await addTeamToPrimary({
        teamId: selectedTeamId,
        tier: "uncategorized",
      })
      setSelectedTeamId("")
      toast.success("Team added to primary")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add team")
    } finally {
      setIsAddingTeam(false)
    }
  }

  return (
    <div className="min-w-0 space-y-4">
      <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-xl font-semibold">{list.name}</h2>
              <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                {isPrimary ? "Primary" : "Personal"}
              </span>
              {isSavingMove ? (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Loader2 className="size-3 animate-spin" />
                  Saving
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {boardData.availableTeams.length} teams available outside this board
            </p>
          </div>

          {isPrimary && isAdmin ? (
            <form
              className="flex w-full flex-col gap-2 sm:max-w-md sm:flex-row sm:items-end"
              onSubmit={handleAddTeamToPrimary}
            >
              <div className="grid flex-1 gap-1.5">
                <Label htmlFor="available-team">Add team</Label>
                <select
                  id="available-team"
                  className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
                  value={selectedTeamId}
                  onChange={(event) =>
                    setSelectedTeamId(event.target.value as AvailableTeamId)
                  }
                  disabled={boardData.availableTeams.length === 0}
                >
                  <option value="">Select team</option>
                  {boardData.availableTeams.map((team) => (
                    <option key={team._id} value={team._id}>
                      {team.teamNumber} - {team.nickname}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                type="submit"
                variant="outline"
                disabled={!selectedTeamId || isAddingTeam}
              >
                {isAddingTeam ? <Loader2 className="animate-spin" /> : <Plus />}
                Add
              </Button>
            </form>
          ) : null}
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={(args) => {
          const pointerIntersections = pointerWithin(args)
          return pointerIntersections.length > 0
            ? pointerIntersections
            : rectIntersection(args)
        }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveItem(null)}
      >
        <div className="grid items-start gap-3 md:grid-cols-2 xl:grid-cols-[repeat(5,minmax(14rem,1fr))] 2xl:grid-cols-[repeat(5,minmax(16rem,1fr))]">
          {orderedColumns.map((column) => (
            <PickListColumn key={column.tier} column={column} canEdit={canEdit} />
          ))}
        </div>

        <DragOverlay>
          {activeItem ? <PickListCard item={activeItem} isOverlay /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}

function PickListColumn({
  column,
  canEdit,
}: {
  column: PickListColumnData
  canEdit: boolean
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.tier,
    data: { type: "column", tier: column.tier },
    disabled: !canEdit,
  })

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex min-h-[18rem] min-w-0 flex-col rounded-lg border bg-card text-card-foreground shadow-sm",
        isOver && "ring-3 ring-ring/40",
      )}
    >
      <header className="flex min-h-12 items-center justify-between gap-2 border-b px-3 py-2">
        <h3 className="truncate text-sm font-semibold">{column.label}</h3>
        <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
          {column.items.length}
        </span>
      </header>

      <SortableContext
        items={column.items.map((item) => item.teamId)}
        strategy={verticalListSortingStrategy}
      >
        <div className="grid min-w-0 flex-1 auto-rows-max gap-2 p-2">
          {column.items.length === 0 ? (
            <div className="flex min-h-24 items-center justify-center rounded-lg border border-dashed px-3 text-center text-sm text-muted-foreground">
              Drop teams here
            </div>
          ) : (
            column.items.map((item) => (
              <PickListCard key={item.teamId} item={item} />
            ))
          )}
        </div>
      </SortableContext>
    </section>
  )
}
