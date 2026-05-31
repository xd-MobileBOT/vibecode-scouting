import { useConvexAuth } from "@convex-dev/auth/react"
import { useQuery } from "convex/react"
import {
  ClipboardCheckIcon,
  GaugeIcon,
  SettingsIcon,
  TrophyIcon,
  UsersIcon,
} from "lucide-react"
import { Link } from "react-router"

import { api } from "../../convex/_generated/api"
import { AuthForm } from "@/components/auth-form"
import { Button } from "@/components/ui/button"

export function HomeRoute() {
  const { isAuthenticated, isLoading } = useConvexAuth()
  const viewer = useQuery(api.events.viewer)
  const activeEvent = useQuery(api.events.active)
  const teamData = useQuery(
    api.teams.listForActiveEvent,
    viewer?.isAuthenticated ? {} : "skip",
  )

  if (isLoading || viewer === undefined || activeEvent === undefined) {
    return <DashboardSkeleton />
  }

  if (!isAuthenticated || !viewer.isAuthenticated) {
    return (
      <section className="grid w-full gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 rounded-lg border px-2.5 py-1 text-xs font-medium text-muted-foreground">
            <TrophyIcon className="size-3.5" />
            Competition scouting
          </div>
          <div className="space-y-3">
            <h1 className="max-w-2xl text-3xl font-semibold tracking-normal sm:text-5xl">
              Fast field notes, cleaner pick meetings.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground">
              Sign in to manage the active event, track pit coverage, review team
              reports, and keep pick tiers visible from the stands.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <LandingMetric icon={UsersIcon} label="Teams" value="Event roster" />
            <LandingMetric icon={ClipboardCheckIcon} label="Pit" value="Coverage" />
            <LandingMetric icon={GaugeIcon} label="Reports" value="Averages" />
          </div>
        </div>
        <AuthForm />
      </section>
    )
  }

  const teams = teamData?.teams ?? []
  const pitComplete = teams.filter((team) => team.pitScouted).length
  const reportCount = teams.reduce((total, team) => total + team.matchReportCount, 0)
  const topTier = teams.filter((team) => team.pickTier === "tier1").length

  return (
    <section className="w-full space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            {viewer.name ?? viewer.email}
          </p>
          <h1 className="text-3xl font-semibold sm:text-4xl">
            {activeEvent
              ? `${activeEvent.name ?? activeEvent.eventKey} dashboard`
              : "Set up an event"}
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            {activeEvent
              ? "Track roster coverage and jump into team details before the next match."
              : "Import a TBA event key to activate the roster and match schedule."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button render={<Link to="/teams" />} variant="outline">
            <UsersIcon />
            Teams
          </Button>
          {viewer.isAdmin && (
            <Button render={<Link to="/event-setup" />}>
              <SettingsIcon />
              Event setup
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardMetric icon={TrophyIcon} label="Active event" value={activeEvent?.eventKey ?? "-"} />
        <DashboardMetric icon={UsersIcon} label="Teams" value={teams.length} />
        <DashboardMetric
          icon={ClipboardCheckIcon}
          label="Pit complete"
          value={`${pitComplete}/${teams.length}`}
        />
        <DashboardMetric icon={GaugeIcon} label="Match reports" value={reportCount} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">Team coverage</h2>
              <p className="text-sm text-muted-foreground">
                Pit scouting and match report progress for the active event.
              </p>
            </div>
            <Button render={<Link to="/teams" />} variant="ghost" size="sm">
              Open
            </Button>
          </div>
          <div className="mt-4 space-y-2">
            {teams.slice(0, 5).map((team) => (
              <div
                key={team._id}
                className="flex items-center justify-between rounded-lg bg-muted px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {team.teamNumber} {team.nickname}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {team.pitScouted ? "Pit done" : "Pit open"} ·{" "}
                    {team.matchReportCount} reports
                  </p>
                </div>
                <span className="rounded-md bg-background px-2 py-1 text-xs">
                  {team.pickTier}
                </span>
              </div>
            ))}
            {teams.length === 0 && (
              <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                No teams loaded for the active event yet.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <h2 className="font-semibold">Pick list signal</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tier 1 count and current scouting volume.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <DashboardMetric icon={TrophyIcon} label="Tier 1" value={topTier} />
            <DashboardMetric icon={GaugeIcon} label="Reports/team" value={teams.length ? Math.round((reportCount / teams.length) * 10) / 10 : 0} />
          </div>
        </div>
      </div>
    </section>
  )
}

function DashboardSkeleton() {
  return (
    <section className="w-full space-y-4">
      <div className="h-10 w-56 animate-pulse rounded-lg bg-muted" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-24 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    </section>
  )
}

function LandingMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof TrophyIcon
  label: string
  value: string
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <Icon className="mb-2 size-4 text-muted-foreground" />
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  )
}

function DashboardMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof TrophyIcon
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </div>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  )
}
