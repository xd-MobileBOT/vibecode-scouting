import * as React from "react"
import { useMutation, useQuery } from "convex/react"
import type { FunctionReturnType } from "convex/server"
import {
  ClipboardCheckIcon,
  ClipboardListIcon,
  SaveIcon,
  SearchIcon,
} from "lucide-react"
import { toast } from "sonner"

import { api } from "../../convex/_generated/api"
import { AuthForm } from "@/components/auth-form"
import { StatusPill } from "@/components/scouting/status-pill"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { climbOptions, scoreFields } from "@/lib/scouting-contract"
import { cn } from "@/lib/utils"

type PitData = FunctionReturnType<typeof api.pitScouting.list>
type PitTeam = PitData["teams"][number]

type PitFormState = {
  coralL1: boolean
  coralL2: boolean
  coralL3: boolean
  coralL4: boolean
  algaeHigh: boolean
  algaeLow: boolean
  lowClimb: boolean
  highClimb: boolean
  drivetrain: string
  notes: string
}

const defaultPitForm: PitFormState = {
  coralL1: false,
  coralL2: false,
  coralL3: false,
  coralL4: false,
  algaeHigh: false,
  algaeLow: false,
  lowClimb: false,
  highClimb: false,
  drivetrain: "",
  notes: "",
}

const climbCapabilityFields = climbOptions.filter(
  (option) => option.value !== "none"
)

export function PitScoutingRoute() {
  const viewer = useQuery(api.events.viewer)
  const data = useQuery(
    api.pitScouting.list,
    viewer?.isAuthenticated ? {} : "skip",
  )
  const savePitReport = useMutation(api.pitScouting.save)
  const [search, setSearch] = React.useState("")
  const [activeTeam, setActiveTeam] = React.useState<PitTeam | null>(null)
  const [form, setForm] = React.useState<PitFormState>(defaultPitForm)
  const [isSaving, setIsSaving] = React.useState(false)

  const teams = data?.teams ?? []
  const scoutedCount = teams.filter((team) => team.pitReport).length
  const filteredTeams = teams.filter((team) => {
    const query = search.trim().toLowerCase()
    if (!query) {
      return true
    }

    return (
      String(team.teamNumber).includes(query) ||
      team.nickname.toLowerCase().includes(query) ||
      [team.city, team.stateProv, team.country]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query)
    )
  })

  const openTeam = (team: PitTeam) => {
    setActiveTeam(team)
    setForm(reportToForm(team))
  }

  const closeDialog = (open: boolean) => {
    if (!open) {
      setActiveTeam(null)
      setForm(defaultPitForm)
    }
  }

  const updateForm = <Key extends keyof PitFormState>(
    key: Key,
    value: PitFormState[Key]
  ) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const submitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!activeTeam) {
      return
    }

    setIsSaving(true)
    try {
      await savePitReport({ teamId: activeTeam._id, ...form })
      toast.success(`Saved pit report for ${activeTeam.teamNumber}`)
      setActiveTeam(null)
      setForm(defaultPitForm)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Pit report failed")
    } finally {
      setIsSaving(false)
    }
  }

  if (viewer === undefined || (viewer.isAuthenticated && data === undefined)) {
    return <ScoutingShell title="Pit scouting" loading />
  }

  if (!viewer.isAuthenticated) {
    return (
      <section className="mx-auto w-full max-w-md">
        <AuthForm />
      </section>
    )
  }

  if (data === undefined) {
    return <ScoutingShell title="Pit scouting" loading />
  }

  if (!data.event) {
    return (
      <ScoutingShell title="Pit scouting">
        <EmptyState
          title="No active event"
          description="Import or activate an event before collecting pit reports."
        />
      </ScoutingShell>
    )
  }

  return (
    <ScoutingShell
      title="Pit scouting"
      eyebrow={data.event.name ?? data.event.eventKey}
      summary={`${scoutedCount} of ${teams.length} teams scouted`}
    >
      <section className="grid gap-3 sm:grid-cols-3">
        <Metric label="Teams" value={teams.length} />
        <Metric label="Scouted" value={scoutedCount} />
        <Metric label="Remaining" value={Math.max(0, teams.length - scoutedCount)} />
      </section>

      <section className="space-y-3">
        <Label htmlFor="pit-search">Find team</Label>
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="pit-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Number, nickname, or location"
            className="h-11 pl-9"
          />
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filteredTeams.map((team) => (
          <TeamCard key={team._id} team={team} onOpen={openTeam} />
        ))}
      </section>

      {filteredTeams.length === 0 && (
        <EmptyState
          title="No teams match"
          description="Clear the search to return to the full pit list."
        />
      )}

      <Dialog open={Boolean(activeTeam)} onOpenChange={closeDialog}>
        <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-2xl">
          {activeTeam && (
            <form onSubmit={submitForm} className="space-y-5">
              <DialogHeader>
                <DialogTitle>Team {activeTeam.teamNumber}</DialogTitle>
                <DialogDescription>{activeTeam.nickname}</DialogDescription>
              </DialogHeader>

              <fieldset className="space-y-3">
                <legend className="text-sm font-medium text-foreground">
                  Scoring capability
                </legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {scoreFields.map((field) => (
                    <BooleanTile
                      key={field.key}
                      label={field.label}
                      checked={form[field.key]}
                      onCheckedChange={(checked) => updateForm(field.key, checked)}
                    />
                  ))}
                </div>
              </fieldset>

              <fieldset className="space-y-3">
                <legend className="text-sm font-medium text-foreground">
                  Climb capability
                </legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {climbCapabilityFields.map((option) => {
                    const key =
                      option.value === "low" ? "lowClimb" : "highClimb"
                    return (
                      <BooleanTile
                        key={option.value}
                        label={option.label}
                        checked={form[key]}
                        onCheckedChange={(checked) => updateForm(key, checked)}
                      />
                    )
                  })}
                </div>
              </fieldset>

              <div className="space-y-2">
                <Label htmlFor="drivetrain">Drivetrain</Label>
                <Input
                  id="drivetrain"
                  value={form.drivetrain}
                  onChange={(event) => updateForm("drivetrain", event.target.value)}
                  placeholder="Swerve, tank, mecanum..."
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pit-notes">Notes</Label>
                <Textarea
                  id="pit-notes"
                  value={form.notes}
                  onChange={(event) => updateForm("notes", event.target.value)}
                  placeholder="Robot observations, repairs, constraints"
                  className="min-h-28"
                />
              </div>

              <DialogFooter>
                <Button
                  type="submit"
                  className="h-11"
                  disabled={isSaving}
                >
                  <SaveIcon />
                  {isSaving ? "Saving" : "Save report"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </ScoutingShell>
  )
}

function reportToForm(team: PitTeam): PitFormState {
  if (!team.pitReport) {
    return defaultPitForm
  }

  return {
    coralL1: team.pitReport.coralL1,
    coralL2: team.pitReport.coralL2,
    coralL3: team.pitReport.coralL3,
    coralL4: team.pitReport.coralL4,
    algaeHigh: team.pitReport.algaeHigh,
    algaeLow: team.pitReport.algaeLow,
    lowClimb: team.pitReport.lowClimb,
    highClimb: team.pitReport.highClimb,
    drivetrain: team.pitReport.drivetrain,
    notes: team.pitReport.notes,
  }
}

function TeamCard({
  team,
  onOpen,
}: {
  team: PitTeam
  onOpen: (team: PitTeam) => void
}) {
  const location = [team.city, team.stateProv, team.country].filter(Boolean).join(", ")

  return (
    <article className="rounded-lg border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-2xl font-semibold tabular-nums text-foreground">
            {team.teamNumber}
          </p>
          <h2 className="line-clamp-2 text-sm font-medium">{team.nickname}</h2>
        </div>
        <StatusPill tone={team.pitReport ? "complete" : "open"}>
          {team.pitReport ? "Scouted" : "Open"}
        </StatusPill>
      </div>
      {location && (
        <p className="mt-3 line-clamp-1 text-sm text-muted-foreground">
          {location}
        </p>
      )}
      <Button
        type="button"
        variant={team.pitReport ? "outline" : "default"}
        className="mt-4 h-11 w-full"
        onClick={() => onOpen(team)}
      >
        {team.pitReport ? <ClipboardCheckIcon /> : <ClipboardListIcon />}
        {team.pitReport ? "Review report" : "Scout team"}
      </Button>
    </article>
  )
}

function BooleanTile({
  label,
  checked,
  onCheckedChange,
}: {
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <label
      className={cn(
        "flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-lg border p-3 transition-colors",
        checked ? "border-primary bg-primary/5" : "border-border bg-background"
      )}
    >
      <span className="text-sm font-medium">{label}</span>
      <Checkbox
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
    </label>
  )
}

function ScoutingShell({
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
