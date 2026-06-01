import { v } from "convex/values"

import {
  action,
  internalMutation,
  type MutationCtx,
} from "./_generated/server"
import { internal } from "./_generated/api"
import { requireAdmin } from "./authz"
import type { Id } from "./_generated/dataModel"

type TbaTeam = {
  key: string
  team_number: number
  nickname?: string | null
  city?: string | null
  state_prov?: string | null
  country?: string | null
}

type TbaMatch = {
  key: string
  comp_level: string
  match_number: number
  time?: number | null
  predicted_time?: number | null
  alliances: {
    red: { team_keys: string[] }
    blue: { team_keys: string[] }
  }
}

type ImportResult = {
  eventId: Id<"events">
  teamCount: number
  matchCount: number
}

export const importEvent = action({
  args: { eventKey: v.string() },
  handler: async (ctx, args): Promise<ImportResult> => {
    const user = await requireAdmin(ctx)
    const eventKey = args.eventKey.trim().toLowerCase()
    const apiKey = process.env.TBA_API_KEY

    if (!apiKey) {
      throw new Error(
        "TBA_API_KEY is missing in Convex environment variables.",
      )
    }

    if (!/^\d{4}[a-z0-9]+$/.test(eventKey)) {
      throw new Error("Enter a valid TBA event key, like 2025nvlv.")
    }

    const [teams, matches] = await fetchEventData({
      eventKey,
      apiKey,
    })

    const qualificationMatches = matches.filter((match) => match.comp_level === "qm")

    const result: ImportResult = await ctx.runMutation(internal.tba.applyImport, {
      eventKey,
      importedByUserId: user.userId,
      teams: teams.map((team) => ({
        tbaTeamKey: team.key,
        teamNumber: team.team_number,
        nickname: team.nickname ?? `Team ${team.team_number}`,
        city: team.city ?? null,
        stateProv: team.state_prov ?? null,
        country: team.country ?? null,
      })),
      matches: qualificationMatches.map((match) => ({
        tbaMatchKey: match.key,
        matchNumber: match.match_number,
        scheduledTime: match.predicted_time ?? match.time ?? null,
        redTeamNumbers: match.alliances.red.team_keys.map(teamNumberFromTbaKey),
        blueTeamNumbers: match.alliances.blue.team_keys.map(teamNumberFromTbaKey),
      })),
    })

    return result
  },
})

export const applyImport = internalMutation({
  args: {
    eventKey: v.string(),
    importedByUserId: v.id("users"),
    teams: v.array(
      v.object({
        tbaTeamKey: v.string(),
        teamNumber: v.number(),
        nickname: v.string(),
        city: v.union(v.string(), v.null()),
        stateProv: v.union(v.string(), v.null()),
        country: v.union(v.string(), v.null()),
      }),
    ),
    matches: v.array(
      v.object({
        tbaMatchKey: v.string(),
        matchNumber: v.number(),
        scheduledTime: v.union(v.number(), v.null()),
        redTeamNumbers: v.array(v.number()),
        blueTeamNumbers: v.array(v.number()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    const activeEvents = await ctx.db
      .query("events")
      .withIndex("by_active", (q) => q.eq("active", true))
      .collect()
    for (const activeEvent of activeEvents) {
      await ctx.db.patch(activeEvent._id, { active: false, updatedAt: now })
    }

    const existingEvent = await ctx.db
      .query("events")
      .withIndex("by_eventKey", (q) => q.eq("eventKey", args.eventKey))
      .first()

    const eventId: Id<"events"> = existingEvent
      ? existingEvent._id
      : await ctx.db.insert("events", {
          eventKey: args.eventKey,
          name: null,
          active: true,
          importedByUserId: args.importedByUserId,
          importedAt: now,
          updatedAt: now,
        })

    if (existingEvent) {
      await ctx.db.patch(eventId, {
        active: true,
        importedByUserId: args.importedByUserId,
        updatedAt: now,
      })
    }

    for (const team of args.teams) {
      const existingTeam = await ctx.db
        .query("teams")
        .withIndex("by_eventId_and_tbaTeamKey", (q) =>
          q.eq("eventId", eventId).eq("tbaTeamKey", team.tbaTeamKey),
        )
        .first()

      if (existingTeam) {
        await ctx.db.patch(existingTeam._id, team)
      } else {
        await ctx.db.insert("teams", { eventId, ...team })
      }
    }

    for (const match of args.matches) {
      const existingMatch = await ctx.db
        .query("matches")
        .withIndex("by_eventId_and_tbaMatchKey", (q) =>
          q.eq("eventId", eventId).eq("tbaMatchKey", match.tbaMatchKey),
        )
        .first()

      if (existingMatch) {
        await ctx.db.patch(existingMatch._id, match)
      } else {
        await ctx.db.insert("matches", { eventId, ...match })
      }
    }

    const personalLists = await ctx.db
      .query("pickLists")
      .withIndex("by_eventId_and_type", (q) =>
        q.eq("eventId", eventId).eq("type", "personal"),
      )
      .collect()

    for (const list of personalLists) {
      await ensurePersonalListTeams(ctx, eventId, list._id)
    }

    return {
      eventId,
      teamCount: args.teams.length,
      matchCount: args.matches.length,
    }
  },
})

async function tbaFetch<T>(path: string, apiKey: string): Promise<T> {
  const response = await fetch(`https://www.thebluealliance.com/api/v3${path}`, {
    headers: {
      "X-TBA-Auth-Key": apiKey,
      "User-Agent": "frc-scouting-app/1.0",
    },
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("The TBA API key was rejected. Paste a valid TBA API key and try again.")
    }
    if (response.status === 404) {
      throw new Error("TBA could not find that event key.")
    }
    throw new Error(`TBA request failed (${response.status}) for ${path}`)
  }

  return (await response.json()) as T
}

async function fetchEventData({
  eventKey,
  apiKey,
}: {
  eventKey: string
  apiKey: string
}): Promise<[TbaTeam[], TbaMatch[]]> {
  return await Promise.all([
    tbaFetch<TbaTeam[]>(`/event/${eventKey}/teams/simple`, apiKey),
    tbaFetch<TbaMatch[]>(`/event/${eventKey}/matches/simple`, apiKey),
  ])
}

function teamNumberFromTbaKey(teamKey: string) {
  return Number(teamKey.replace(/^frc/, ""))
}

async function ensurePersonalListTeams(
  ctx: MutationCtx,
  eventId: Id<"events">,
  pickListId: Id<"pickLists">,
) {
  const teams = await ctx.db
    .query("teams")
    .withIndex("by_eventId", (q) => q.eq("eventId", eventId))
    .collect()
  const existingItems = await ctx.db
    .query("pickListItems")
    .withIndex("by_pickListId", (q) => q.eq("pickListId", pickListId))
    .collect()
  const existingTeamIds = new Set(existingItems.map((item) => item.teamId))
  let nextOrder =
    Math.max(-1, ...existingItems.map((item) => item.order)) + 1

  for (const team of teams.sort((a, b) => a.teamNumber - b.teamNumber)) {
    if (existingTeamIds.has(team._id)) {
      continue
    }
    await ctx.db.insert("pickListItems", {
      eventId,
      pickListId,
      teamId: team._id,
      teamNumber: team.teamNumber,
      tier: "uncategorized",
      order: nextOrder,
    })
    nextOrder += 1
  }
}
