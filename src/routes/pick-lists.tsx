import { useMutation, useQuery } from "convex/react"
import { ClipboardList, Loader2, ShieldCheck } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { PickListBoard } from "@/components/pick-list/pick-list-board"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

type PickListId = Id<"pickLists">

export function PickListsRoute() {
  const viewer = useQuery(api.events.viewer)
  const landing = useQuery(
    api.pickLists.landing,
    viewer?.isAuthenticated ? {} : "skip",
  )
  const createPersonal = useMutation(api.pickLists.createPersonal)
  const ensurePrimary = useMutation(api.pickLists.ensurePrimary)
  const importConsensus = useMutation(api.pickLists.importConsensusToPrimary)

  const [selectedListId, setSelectedListId] = useState<PickListId | null>(null)
  const [newListName, setNewListName] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [isEnsuringPrimary, setIsEnsuringPrimary] = useState(false)
  const [isImportingConsensus, setIsImportingConsensus] = useState(false)

  const selectableLists = useMemo(() => {
    if (!landing) {
      return []
    }

    return [
      ...(landing.primaryList
        ? [{ ...landing.primaryList, displayType: "Primary" }]
        : []),
      ...landing.personalLists.map((list) => ({
        ...list,
        displayType: "Personal",
      })),
    ]
  }, [landing])

  const defaultListId =
    landing?.primaryList?._id ?? landing?.personalLists[0]?._id ?? null
  const selectedListStillExists = selectableLists.some(
    (list) => list._id === selectedListId,
  )
  const effectiveSelectedListId = selectedListStillExists
    ? selectedListId
    : defaultListId
  const selectedList =
    selectableLists.find((list) => list._id === effectiveSelectedListId) ?? null

  async function handleCreatePersonal(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsCreating(true)

    try {
      const listId = await createPersonal({
        name: newListName.trim() || "My Pick List",
      })
      setNewListName("")
      setSelectedListId(listId)
      toast.success("Personal pick list created")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create list")
    } finally {
      setIsCreating(false)
    }
  }

  async function handleEnsurePrimary() {
    setIsEnsuringPrimary(true)

    try {
      const listId = await ensurePrimary({})
      setSelectedListId(listId)
      toast.success("Primary pick list is ready")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not create primary list",
      )
    } finally {
      setIsEnsuringPrimary(false)
    }
  }

  async function handleImportConsensus() {
    setIsImportingConsensus(true)

    try {
      const listId = await importConsensus({})
      setSelectedListId(listId)
      toast.success("Consensus imported to primary")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not import consensus",
      )
    } finally {
      setIsImportingConsensus(false)
    }
  }

  if (viewer === undefined || (viewer.isAuthenticated && landing === undefined)) {
    return (
      <section className="flex min-h-[50vh] w-full items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </section>
    )
  }

  if (!viewer.isAuthenticated) {
    return (
      <section className="flex w-full items-center justify-center">
        <div className="w-full max-w-xl rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Pick Lists</p>
          <h1 className="mt-2 text-3xl font-semibold">Sign in required</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Sign in to view and organize event pick lists.
          </p>
        </div>
      </section>
    )
  }

  if (landing === undefined) {
    return (
      <section className="flex min-h-[50vh] w-full items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </section>
    )
  }

  if (!landing.event) {
    return (
      <section className="flex w-full items-center justify-center">
        <div className="w-full max-w-xl rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Pick Lists</p>
          <h1 className="mt-2 text-3xl font-semibold">No active event</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Import or activate an event before building pick lists.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">
            {landing.event.name}
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-normal sm:text-4xl">
            Pick lists
          </h1>
        </div>

        <form
          className="flex w-full flex-col gap-2 sm:max-w-md sm:flex-row sm:items-end"
          onSubmit={handleCreatePersonal}
        >
          <div className="grid flex-1 gap-1.5">
            <Label htmlFor="pick-list-name">New personal list</Label>
            <Input
              id="pick-list-name"
              value={newListName}
              onChange={(event) => setNewListName(event.target.value)}
              placeholder="Drive team board"
            />
          </div>
          <Button type="submit" disabled={isCreating}>
            {isCreating ? <Loader2 className="animate-spin" /> : <ClipboardList />}
            Create
          </Button>
        </form>
      </div>

      <div className="grid gap-6 xl:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="space-y-4">
          <div className="rounded-lg border bg-card p-3 text-card-foreground shadow-sm">
            <div className="flex items-center justify-between gap-2 px-1 pb-2">
              <h2 className="text-sm font-semibold">Boards</h2>
              <span className="text-xs text-muted-foreground">
                {selectableLists.length}
              </span>
            </div>

            <div className="space-y-1">
              {selectableLists.length === 0 ? (
                <p className="px-1 py-6 text-sm text-muted-foreground">
                  Create a personal list or start the primary board.
                </p>
              ) : (
                selectableLists.map((list) => (
                  <button
                    key={list._id}
                    className="flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground"
                    data-selected={list._id === effectiveSelectedListId}
                    type="button"
                    onClick={() => setSelectedListId(list._id)}
                  >
                    <span className="min-w-0 truncate font-medium">
                      {list.name}
                    </span>
                    <span className="shrink-0 text-xs opacity-75">
                      {list.displayType}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          {viewer.isAdmin ? (
            <div className="rounded-lg border bg-card p-3 text-card-foreground shadow-sm">
              <div className="flex items-center gap-2 px-1">
                <ShieldCheck className="size-4 text-primary" />
                <h2 className="text-sm font-semibold">Admin</h2>
              </div>
              <Separator className="my-3" />
              <div className="grid gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleEnsurePrimary}
                  disabled={isEnsuringPrimary}
                >
                  {isEnsuringPrimary ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <ClipboardList />
                  )}
                  Blank primary board
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleImportConsensus}
                  disabled={isImportingConsensus}
                >
                  {isImportingConsensus ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <ShieldCheck />
                  )}
                  Import consensus
                </Button>
              </div>
            </div>
          ) : null}
        </aside>

        <PickListBoard
          isAdmin={viewer.isAdmin}
          list={selectedList}
          pickListId={effectiveSelectedListId}
        />
      </div>
    </section>
  )
}
