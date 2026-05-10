import * as React from "react"
import { useMutation, useQuery } from "convex/react"
import type { FunctionReturnType } from "convex/server"
import {
  ClipboardCheckIcon,
  EraserIcon,
  LockOpenIcon,
  SaveIcon,
  ShieldIcon,
} from "lucide-react"
import { toast } from "sonner"

import { api } from "../../convex/_generated/api"
import { RatingControl } from "@/components/scouting/rating-control"
import { ScoreStepper } from "@/components/scouting/score-stepper"
import { StatusPill } from "@/components/scouting/status-pill"
import { TagToggle } from "@/components/scouting/tag-toggle"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  climbOptions,
  emptyScoreCounts,
  matchTags,
  scoreFields,
  type ClimbResult,
  type ScoreCounts,
} from "@/lib/scouting-contract"
import { cn } from "@/lib/utils"

type MatchData = FunctionReturnType<typeof api.matchScouting.landing>
type MatchSummary = MatchData["matches"][number]
type ScheduledRobot = MatchSummary["teams"][number]

type MatchReportForm = {
  auto: ScoreCounts
  autoNotes: string
  teleop: ScoreCounts
  teleopNotes: string
  climb: ClimbResult
  endgameNotes: string
  driverRating: number
  defenseRating: number
  tags: string[]
}

const newMatchForm = (): MatchReportForm => ({
  auto: emptyScoreCounts(),
  autoNotes: "",
  teleop: emptyScoreCounts(),
  teleopNotes: "",
  climb: "none",
  endgameNotes: "",
  driverRating: 5,
  defenseRating: 5,
  tags: [],
})

export function MatchScoutingRoute() {
  const data = useQuery(api.matchScouting.landing)
  const reserveRobot = useMutation(api.matchScouting.reserveRobot)
  const releaseReservation = useMutation(api.matchScouting.releaseReservation)
  const submitReport = useMutation(api.matchScouting.submitReport)
  const [selectedMatchId, setSelectedMatchId] = React.useState<string>("")
  const [selectedTeamId, setSelectedTeamId] = React.useState<string>("")
  const [form, setForm] = React.useState<MatchReportForm>(() => newMatchForm())
  const [isMutating, setIsMutating] = React.useState(false)

  const matches = data?.matches ?? []
  const selectedMatch =
    matches.find((match) => match._id === selectedMatchId) ?? matches[0] ?? null
  const selectedRobot = selectedMatch?.teams.find(
    (entry) => entry.team?._id === selectedTeamId
  )

  const changeMatch = (matchId: string) => {
    setSelectedMatchId(matchId)
    setSelectedTeamId("")
    setForm(newMatchForm())
  }

  const startRobot = async (robot: ScheduledRobot) => {
    if (!selectedMatch || !robot.team || robot.submitted || robot.reservedByOther) {
      return
    }

    setIsMutating(true)
    try {
      if (!robot.reservedByMe) {
        await reserveRobot({ matchId: selectedMatch._id, teamId: robot.team._id })
        toast.success(`Reserved team ${robot.team.teamNumber}`)
      }
      setSelectedTeamId(robot.team._id)
      setForm(newMatchForm())
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Reservation failed")
    } finally {
      setIsMutating(false)
    }
  }

  const releaseRobot = async () => {
    if (!selectedMatch || !selectedRobot?.team) {
      return
    }

    setIsMutating(true)
    try {
      await releaseReservation({
        matchId: selectedMatch._id,
        teamId: selectedRobot.team._id,
      })
      toast.success(`Released team ${selectedRobot.team.teamNumber}`)
      setSelectedTeamId("")
      setForm(newMatchForm())
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Release failed")
    } finally {
      setIsMutating(false)
    }
  }

  const updateScore = (
    phase: "auto" | "teleop",
    key: keyof ScoreCounts,
    value: number
  ) => {
    setForm((current) => ({
      ...current,
      [phase]: { ...current[phase], [key]: value },
    }))
  }

  const toggleTag = (tag: string) => {
    setForm((current) => ({
      ...current,
      tags: current.tags.includes(tag)
        ? current.tags.filter((candidate) => candidate !== tag)
        : [...current.tags, tag],
    }))
  }

  const submitCurrentReport = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedMatch || !selectedRobot?.team) {
      return
    }

    setIsMutating(true)
    try {
      await submitReport({
        matchId: selectedMatch._id,
        teamId: selectedRobot.team._id,
        ...form,
      })
      toast.success(
        `Submitted match ${selectedMatch.matchNumber}, team ${selectedRobot.team.teamNumber}`
      )
      setSelectedTeamId("")
      setForm(newMatchForm())
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Submission failed")
    } finally {
      setIsMutating(false)
    }
  }

  if (data === undefined) {
    return <MatchShell title="Match scouting" loading />
  }

  if (!data.event) {
    return (
      <MatchShell title="Match scouting">
        <EmptyState
          title="No active event"
          description="Import or activate an event before collecting match reports."
        />
      </MatchShell>
    )
  }

  const submittedRobots = matches.reduce(
    (count, match) => count + match.teams.filter((team) => team.submitted).length,
    0
  )
  const totalRobots = matches.reduce((count, match) => count + match.teams.length, 0)

  return (
    <MatchShell
      title="Match scouting"
      eyebrow={data.event.name ?? data.event.eventKey}
      summary={`${submittedRobots} of ${totalRobots} robot reports submitted`}
    >
      <section className="grid gap-3 sm:grid-cols-3">
        <Metric label="Matches" value={matches.length} />
        <Metric label="Reports" value={submittedRobots} />
        <Metric label="Open robots" value={Math.max(0, totalRobots - submittedRobots)} />
      </section>

      <section className="space-y-3">
        <Label htmlFor="match-select">Match</Label>
        <Select
          value={selectedMatch?._id ?? ""}
          onValueChange={(value) => {
            if (value) {
              changeMatch(value)
            }
          }}
        >
          <SelectTrigger id="match-select" className="h-11 w-full">
            <SelectValue placeholder="Choose a match" />
          </SelectTrigger>
          <SelectContent>
            {matches.map((match) => (
              <SelectItem key={match._id} value={match._id}>
                Match {match.matchNumber}
                {match.scheduledTime ? ` - ${formatMatchTime(match.scheduledTime)}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>

      {selectedMatch && (
        <section className="space-y-3">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                Match {selectedMatch.matchNumber}
              </h2>
              <p className="text-sm text-muted-foreground">
                Reserve one robot before submitting a report.
              </p>
            </div>
            {selectedMatch.scheduledTime && (
              <p className="text-sm font-medium text-muted-foreground">
                {formatMatchTime(selectedMatch.scheduledTime)}
              </p>
            )}
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            <AlliancePanel
              alliance="red"
              match={selectedMatch}
              robots={selectedMatch.teams.slice(
                0,
                selectedMatch.redTeamNumbers.length
              )}
              selectedTeamId={selectedTeamId}
              disabled={isMutating}
              onScout={startRobot}
            />
            <AlliancePanel
              alliance="blue"
              match={selectedMatch}
              robots={selectedMatch.teams.slice(selectedMatch.redTeamNumbers.length)}
              selectedTeamId={selectedTeamId}
              disabled={isMutating}
              onScout={startRobot}
            />
          </div>
        </section>
      )}

      {selectedMatch && selectedRobot?.team ? (
        <form
          onSubmit={submitCurrentReport}
          className="space-y-5 rounded-lg border bg-muted/25 p-4"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Active report
              </p>
              <h2 className="text-2xl font-semibold">
                Match {selectedMatch.matchNumber}, team {selectedRobot.team.teamNumber}
              </h2>
              <p className="text-sm text-muted-foreground">
                {selectedRobot.team.nickname}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-11"
                onClick={releaseRobot}
                disabled={isMutating}
              >
                <LockOpenIcon />
                Release
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11"
                onClick={() => setForm(newMatchForm())}
                disabled={isMutating}
              >
                <EraserIcon />
                Clear
              </Button>
            </div>
          </div>

          <ScoreSection
            title="Autonomous"
            scores={form.auto}
            notes={form.autoNotes}
            notesId="auto-notes"
            onScoreChange={(key, value) => updateScore("auto", key, value)}
            onNotesChange={(value) =>
              setForm((current) => ({ ...current, autoNotes: value }))
            }
          />

          <ScoreSection
            title="Teleop"
            scores={form.teleop}
            notes={form.teleopNotes}
            notesId="teleop-notes"
            onScoreChange={(key, value) => updateScore("teleop", key, value)}
            onNotesChange={(value) =>
              setForm((current) => ({ ...current, teleopNotes: value }))
            }
          />

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-foreground">Climb</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {climbOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={cn(
                    "min-h-11 rounded-lg border px-3 text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                    form.climb === option.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background hover:bg-muted"
                  )}
                  onClick={() =>
                    setForm((current) => ({ ...current, climb: option.value }))
                  }
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="space-y-2">
            <Label htmlFor="endgame-notes">Endgame notes</Label>
            <Textarea
              id="endgame-notes"
              value={form.endgameNotes}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  endgameNotes: event.target.value,
                }))
              }
              placeholder="Climb attempt, park, disabled, last-second behavior"
              className="min-h-24"
            />
          </div>

          <RatingControl
            label="Driver rating"
            value={form.driverRating}
            onChange={(driverRating) =>
              setForm((current) => ({ ...current, driverRating }))
            }
          />
          <RatingControl
            label="Defense rating"
            value={form.defenseRating}
            onChange={(defenseRating) =>
              setForm((current) => ({ ...current, defenseRating }))
            }
          />

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-foreground">Tags</legend>
            <div className="flex flex-wrap gap-2">
              {matchTags.map((tag) => (
                <TagToggle
                  key={tag}
                  label={tag}
                  selected={form.tags.includes(tag)}
                  onToggle={toggleTag}
                />
              ))}
            </div>
          </fieldset>

          <Button type="submit" className="h-12 w-full" disabled={isMutating}>
            <SaveIcon />
            {isMutating ? "Submitting" : "Submit report"}
          </Button>
        </form>
      ) : (
        <EmptyState
          title="Choose a robot"
          description="Tap an open team card to reserve that robot and open the match form."
        />
      )}
    </MatchShell>
  )
}

function AlliancePanel({
  alliance,
  match,
  robots,
  selectedTeamId,
  disabled,
  onScout,
}: {
  alliance: "red" | "blue"
  match: MatchSummary
  robots: ScheduledRobot[]
  selectedTeamId: string
  disabled: boolean
  onScout: (robot: ScheduledRobot) => void
}) {
  const teamNumbers =
    alliance === "red" ? match.redTeamNumbers : match.blueTeamNumbers

  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        alliance === "red"
          ? "border-red-500/25 bg-red-500/5"
          : "border-sky-500/25 bg-sky-500/5"
      )}
    >
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {alliance}
      </h3>
      <div className="grid gap-2">
        {robots.map((robot, index) => (
          <RobotCard
            key={robot.team?._id ?? `${alliance}-${teamNumbers[index]}`}
            teamNumber={robot.team?.teamNumber ?? teamNumbers[index]}
            robot={robot}
            selected={robot.team?._id === selectedTeamId}
            disabled={disabled}
            onScout={onScout}
          />
        ))}
      </div>
    </div>
  )
}

function RobotCard({
  teamNumber,
  robot,
  selected,
  disabled,
  onScout,
}: {
  teamNumber: number
  robot: ScheduledRobot
  selected: boolean
  disabled: boolean
  onScout: (robot: ScheduledRobot) => void
}) {
  const status = getRobotStatus(robot)
  const unavailable = !robot.team || robot.submitted || robot.reservedByOther

  return (
    <article
      className={cn(
        "rounded-lg border bg-background p-3",
        selected && "border-primary ring-2 ring-primary/20"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xl font-semibold tabular-nums">{teamNumber}</p>
          <p className="line-clamp-1 text-sm text-muted-foreground">
            {robot.team?.nickname ?? "Team record missing"}
          </p>
        </div>
        <StatusPill tone={status.tone}>{status.label}</StatusPill>
      </div>
      <Button
        type="button"
        variant={selected ? "secondary" : "outline"}
        className="mt-3 h-11 w-full"
        disabled={disabled || unavailable}
        onClick={() => onScout(robot)}
      >
        {robot.reservedByMe ? <ClipboardCheckIcon /> : <ShieldIcon />}
        {selected ? "Selected" : robot.reservedByMe ? "Continue" : "Scout"}
      </Button>
    </article>
  )
}

function getRobotStatus(robot: ScheduledRobot): {
  tone: "complete" | "open" | "locked"
  label: string
} {
  if (robot.submitted) {
    return { tone: "complete", label: "Submitted" }
  }
  if (robot.reservedByMe) {
    return { tone: "locked", label: "Mine" }
  }
  if (robot.reservedByOther) {
    return { tone: "locked", label: robot.reservedByName ?? "Reserved" }
  }
  return { tone: "open", label: "Open" }
}

function ScoreSection({
  title,
  scores,
  notes,
  notesId,
  onScoreChange,
  onNotesChange,
}: {
  title: string
  scores: ScoreCounts
  notes: string
  notesId: string
  onScoreChange: (key: keyof ScoreCounts, value: number) => void
  onNotesChange: (value: string) => void
}) {
  return (
    <section className="space-y-3">
      <h3 className="text-base font-semibold">{title}</h3>
      <div className="grid gap-2 lg:grid-cols-2">
        {scoreFields.map((field) => (
          <ScoreStepper
            key={field.key}
            label={field.label}
            value={scores[field.key]}
            onChange={(value) => onScoreChange(field.key, value)}
          />
        ))}
      </div>
      <div className="space-y-2">
        <Label htmlFor={notesId}>{title} notes</Label>
        <Textarea
          id={notesId}
          value={notes}
          onChange={(event) => onNotesChange(event.target.value)}
          placeholder={`${title} misses, cycle notes, penalties`}
          className="min-h-24"
        />
      </div>
    </section>
  )
}

function formatMatchTime(timestamp: number) {
  const milliseconds = timestamp < 1_000_000_000_000 ? timestamp * 1000 : timestamp

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(milliseconds)
}

function MatchShell({
  title,
  eyebrow,
  summary,
  loading = false,
  children,
}: {
  title: string
  eyebrow?: string
  summary?: string
  loading?: boolean
  children?: React.ReactNode
}) {
  return (
    <div className="w-full space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">
          {eyebrow ?? "FRC scouting"}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h1 className="text-3xl font-semibold text-foreground">{title}</h1>
          {summary && <p className="text-sm text-muted-foreground">{summary}</p>}
        </div>
      </header>
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className="h-36 animate-pulse rounded-lg border bg-muted"
            />
          ))}
        </div>
      ) : (
        children
      )}
    </div>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums">{value}</p>
    </div>
  )
}

function EmptyState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center">
      <p className="font-medium text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
