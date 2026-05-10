import { useConvexAuth } from "@convex-dev/auth/react"
import { useQuery } from "convex/react"
import type { Id } from "../../convex/_generated/dataModel"
import {
  ClipboardCheckIcon,
  GaugeIcon,
  MapPinIcon,
  SearchIcon,
  StarIcon,
  UsersIcon,
} from "lucide-react"
import { useMemo, useState } from "react"

import { api } from "../../convex/_generated/api"
import { AuthForm } from "@/components/auth-form"
import { TeamDetailDialog } from "@/components/team-detail-dialog"
import { Input } from "@/components/ui/input"
import { pickTiers } from "@/lib/scouting-contract"

export function TeamsRoute() {
  const { isAuthenticated, isLoading } = useConvexAuth()
  const viewer = useQuery(api.events.viewer)
  const data = useQuery(
    api.teams.listForActiveEvent,
    isAuthenticated ? {} : "skip",
  )
  const [query, setQuery] = useState("")
  const [selectedTeamId, setSelectedTeamId] = useState<Id<"teams"> | null>(null)

  const teams = useMemo(() => data?.teams ?? [], [data?.teams])
  const filteredTeams = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) {
      return teams
    }
    return teams.filter((team) => {
      return (
        String(team.teamNumber).includes(normalizedQuery) ||
        team.nickname.toLowerCase().includes(normalizedQuery)
      )
    })
  }, [query, teams])

  if (isLoading || viewer === undefined) {
    return <div className="h-32 w-full animate-pulse rounded-lg bg-muted" />
  }

  if (!isAuthenticated || !viewer.isAuthenticated) {
    return (
      <section className="mx-auto w-full max-w-md">
        <AuthForm />
      </section>
    )
  }

  return (
    <section className="w-full space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">
            {data?.event ? data.event.eventKey : "No active event"}
          </p>
          <h1 className="text-3xl font-semibold sm:text-4xl">Teams</h1>
        </div>
        <label className="relative w-full sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search team"
            className="pl-8"
          />
        </label>
      </div>

      {data === undefined ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-40 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : data.event === null ? (
        <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
          No active event is loaded yet.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTeams.map((team) => {
            const tierLabel =
              pickTiers.find((tier) => tier.value === team.pickTier)?.label ??
              "Uncategorized"
            return (
              <button
                key={team._id}
                type="button"
                onClick={() => setSelectedTeamId(team._id)}
                className="rounded-lg border bg-card p-4 text-left shadow-sm outline-none transition-colors hover:bg-muted/40 focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-2xl font-semibold">{team.teamNumber}</p>
                    <p className="truncate text-sm font-medium">{team.nickname}</p>
                  </div>
                  <span className="rounded-md bg-secondary px-2 py-1 text-xs text-secondary-foreground">
                    {tierLabel}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPinIcon className="size-3.5" />
                  <span className="truncate">
                    {[team.city, team.stateProv, team.country].filter(Boolean).join(", ") ||
                      "No location"}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <CardMetric
                    icon={ClipboardCheckIcon}
                    label="Pit"
                    value={team.pitScouted ? "Done" : "Open"}
                  />
                  <CardMetric
                    icon={GaugeIcon}
                    label="Reports"
                    value={team.matchReportCount}
                  />
                  <CardMetric icon={StarIcon} label="Driver" value={team.averages.driverRating || "-"} />
                </div>
              </button>
            )
          })}
        </div>
      )}

      {data !== undefined && filteredTeams.length === 0 && data.event !== null && (
        <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
          No teams match that search.
        </div>
      )}

      <TeamDetailDialog
        teamId={selectedTeamId}
        open={selectedTeamId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTeamId(null)
          }
        }}
      />
    </section>
  )
}

function CardMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UsersIcon
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="rounded-md bg-muted px-2 py-2">
      <div className="flex items-center gap-1 text-[0.7rem] text-muted-foreground">
        <Icon className="size-3" />
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  )
}
