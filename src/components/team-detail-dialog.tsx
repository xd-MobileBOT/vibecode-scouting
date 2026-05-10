import { useQuery } from "convex/react"
import type { Id } from "../../convex/_generated/dataModel"
import type { FunctionReturnType } from "convex/server"
import {
  ActivityIcon,
  ClipboardCheckIcon,
  GaugeIcon,
  MapPinIcon,
  NotebookTextIcon,
  StarIcon,
} from "lucide-react"

import { api } from "../../convex/_generated/api"
import { pickTiers } from "@/lib/scouting-contract"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

type TeamDetail = NonNullable<FunctionReturnType<typeof api.teams.detail>>

type TeamDetailDialogProps = {
  teamId: Id<"teams"> | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TeamDetailDialog({
  teamId,
  open,
  onOpenChange,
}: TeamDetailDialogProps) {
  const detail = useQuery(api.teams.detail, teamId ? { teamId } : "skip")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100svh-2rem)] overflow-hidden p-0 sm:max-w-2xl">
        <ScrollArea className="max-h-[calc(100svh-2rem)]">
          <div className="p-4">
            {detail === undefined ? (
              <div className="space-y-3">
                <div className="h-6 w-32 animate-pulse rounded bg-muted" />
                <div className="h-20 animate-pulse rounded-lg bg-muted" />
              </div>
            ) : detail === null ? (
              <DialogHeader>
                <DialogTitle>Team unavailable</DialogTitle>
                <DialogDescription>
                  The selected team could not be loaded.
                </DialogDescription>
              </DialogHeader>
            ) : (
              <TeamDetailContent detail={detail} />
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

function TeamDetailContent({ detail }: { detail: TeamDetail }) {
  const { team, pitReport, matchReports, averages, pickTier } = detail
  const tierLabel =
    pickTiers.find((tier) => tier.value === pickTier)?.label ?? "Uncategorized"

  return (
    <div className="space-y-5">
      <DialogHeader>
        <DialogTitle className="text-xl">
          Team {team.teamNumber} {team.nickname}
        </DialogTitle>
        <DialogDescription className="flex flex-wrap items-center gap-2">
          <MapPinIcon className="size-4" />
          {[team.city, team.stateProv, team.country].filter(Boolean).join(", ") ||
            "No location recorded"}
        </DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Metric icon={ClipboardCheckIcon} label="Pit" value={pitReport ? "Done" : "Open"} />
        <Metric icon={NotebookTextIcon} label="Reports" value={matchReports.length} />
        <Metric icon={StarIcon} label="Pick tier" value={tierLabel} />
        <Metric icon={GaugeIcon} label="Driver" value={averages.driverRating || "-"} />
      </div>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold">Averages</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Stat label="Auto coral" value={averages.autoCoral} />
          <Stat label="Teleop coral" value={averages.teleopCoral} />
          <Stat label="Auto algae" value={averages.autoAlgae} />
          <Stat label="Teleop algae" value={averages.teleopAlgae} />
          <Stat label="L4 teleop" value={averages.teleopCoralL4} />
          <Stat label="Climb score" value={averages.climbScore} />
        </div>
      </section>

      <Separator />

      <section className="space-y-2">
        <h3 className="text-sm font-semibold">Pit report</h3>
        {pitReport ? (
          <div className="rounded-lg border p-3">
            <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
              <Stat label="Drivetrain" value={pitReport.drivetrain || "-"} />
              <Stat label="Low climb" value={pitReport.lowClimb ? "Yes" : "No"} />
              <Stat label="High climb" value={pitReport.highClimb ? "Yes" : "No"} />
            </div>
            {pitReport.notes && (
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {pitReport.notes}
              </p>
            )}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
            No pit report has been submitted for this team yet.
          </p>
        )}
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold">Match reports</h3>
        {matchReports.length > 0 ? (
          <div className="space-y-2">
            {matchReports.map((report) => (
              <div key={report._id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">Match {report.matchNumber}</p>
                  <p className="text-xs text-muted-foreground">
                    Driver {report.driverRating} / Defense {report.defenseRating}
                  </p>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                  <Stat label="Auto coral" value={sumCoral(report.auto)} />
                  <Stat label="Teleop coral" value={sumCoral(report.teleop)} />
                  <Stat label="Auto algae" value={sumAlgae(report.auto)} />
                  <Stat label="Climb" value={report.climb} />
                </div>
                {report.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {report.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
            No match reports have been submitted for this team yet.
          </p>
        )}
      </section>
    </div>
  )
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof ActivityIcon
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md bg-muted px-2.5 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  )
}

function sumCoral(score: TeamDetail["matchReports"][number]["auto"]) {
  return score.coralL1 + score.coralL2 + score.coralL3 + score.coralL4
}

function sumAlgae(score: TeamDetail["matchReports"][number]["auto"]) {
  return score.algaeHigh + score.algaeLow
}
