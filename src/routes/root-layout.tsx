import { useQuery } from "convex/react"
import { Outlet } from "react-router"

import { api } from "../../convex/_generated/api"
import { AppShellNav } from "@/components/app-shell/nav"
import { Separator } from "@/components/ui/separator"
import { Toaster } from "@/components/ui/sonner"

export function RootLayout() {
  const viewer = useQuery(api.events.viewer)
  const activeEvent = useQuery(api.events.active)

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <AppShellNav viewer={viewer} />

      <main className="mx-auto flex w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <Outlet />
      </main>

      <Separator />
      <footer className="mx-auto flex min-h-12 w-full max-w-6xl flex-col justify-center gap-0.5 px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <span>FRC scouting workspace</span>
        <span>
          {activeEvent === undefined
            ? "Loading event"
            : activeEvent
              ? `Active event: ${activeEvent.name ?? activeEvent.eventKey}`
              : "No active event"}
        </span>
      </footer>
      <Toaster richColors closeButton />
    </div>
  )
}
