import { useConvexAuth } from "@convex-dev/auth/react"
import { useAction, useQuery } from "convex/react"
import {
  CalendarSyncIcon,
  Loader2Icon,
  ShieldAlertIcon,
  TrophyIcon,
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { api } from "../../convex/_generated/api"
import { AuthForm } from "@/components/auth-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function EventSetupRoute() {
  const { isAuthenticated, isLoading } = useConvexAuth()
  const viewer = useQuery(api.events.viewer)
  const activeEvent = useQuery(api.events.active)
  const importEvent = useAction(api.tba.importEvent)
  const [isImporting, setIsImporting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const eventKey = String(formData.get("eventKey") ?? "").trim().toLowerCase()

    if (!eventKey) {
      toast.error("Enter a TBA event key")
      return
    }

    setIsImporting(true)
    try {
      const result = await importEvent({ eventKey })
      toast.success(
        `Imported ${result.teamCount} teams and ${result.matchCount} qualification matches`,
      )
      event.currentTarget.reset()
    } catch (error) {
      toast.error(importErrorMessage(error))
    } finally {
      setIsImporting(false)
    }
  }

  if (isLoading || viewer === undefined || activeEvent === undefined) {
    return <div className="h-32 w-full animate-pulse rounded-lg bg-muted" />
  }

  if (!isAuthenticated || !viewer.isAuthenticated) {
    return (
      <section className="mx-auto w-full max-w-md">
        <AuthForm />
      </section>
    )
  }

  if (!viewer.isAdmin) {
    return (
      <section className="mx-auto flex w-full max-w-xl flex-col items-start gap-3 rounded-lg border bg-card p-4">
        <ShieldAlertIcon className="size-5 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Admin access required</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Event import is limited to admins. You can still use the teams and
          scouting views for the active event.
        </p>
      </section>
    )
  }

  return (
    <section className="w-full space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Admin</p>
        <h1 className="text-3xl font-semibold sm:text-4xl">Event setup</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Import the event roster and qualification matches from The Blue
          Alliance. The imported event becomes the active event.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <TrophyIcon className="size-4 text-muted-foreground" />
            <h2 className="font-semibold">Current event</h2>
          </div>
          <div className="mt-4 rounded-lg bg-muted p-3">
            <p className="text-xs text-muted-foreground">Active key</p>
            <p className="mt-1 text-2xl font-semibold">
              {activeEvent?.eventKey ?? "None"}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {activeEvent
                ? activeEvent.name ?? "Imported from TBA"
                : "Import an event key to start scouting."}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <form onSubmit={handleSubmit} className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2">
              <CalendarSyncIcon className="size-4 text-muted-foreground" />
              <h2 className="font-semibold">Import from TBA</h2>
            </div>
            <div className="mt-4 space-y-1.5">
              <Label htmlFor="event-key">Event key</Label>
              <Input
                id="event-key"
                name="eventKey"
                placeholder="2025nvlv"
                autoComplete="off"
                disabled={isImporting}
                required
              />
            </div>
            <Button
              type="submit"
              disabled={isImporting}
              className="mt-4 w-full sm:w-auto"
            >
              {isImporting ? (
                <Loader2Icon className="animate-spin" />
              ) : (
                <CalendarSyncIcon />
              )}
              Import event
            </Button>
          </form>
        </div>
      </div>
    </section>
  )
}

function importErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)

  if (message.includes("TBA_API_KEY")) {
    return "TBA_API_KEY is missing in Convex environment variables."
  }
  if (message.includes("TBA API key was rejected")) {
    return "The TBA API key configured in Convex was rejected."
  }
  if (message.includes("TBA could not find that event key")) {
    return "TBA could not find that event key."
  }

  return message || "Event import failed"
}
