import { v } from "convex/values"

import { mutation, query } from "./_generated/server"
import { requireUser } from "./authz"
import { RESERVATION_TTL_MS } from "./constants"
import { climbValidator, scoreCountsValidator } from "./validators"

export const landing = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx)
    const event = await ctx.db
      .query("events")
      .withIndex("by_active", (q) => q.eq("active", true))
      .first()
    if (!event) {
      return { event: null, matches: [] }
    }

    const matches = await ctx.db
      .query("matches")
      .withIndex("by_eventId", (q) => q.eq("eventId", event._id))
      .collect()
    const teams = await ctx.db
      .query("teams")
      .withIndex("by_eventId", (q) => q.eq("eventId", event._id))
      .collect()
    const reports = await ctx.db
      .query("matchReports")
      .withIndex("by_eventId", (q) => q.eq("eventId", event._id))
      .collect()
    const reservations = await ctx.db
      .query("matchReservations")
      .withIndex("by_eventId", (q) => q.eq("eventId", event._id))
      .collect()
    const now = Date.now()

    return {
      event,
      matches: matches
        .sort((a, b) => a.matchNumber - b.matchNumber)
        .map((match) => {
          const teamNumbers = [...match.redTeamNumbers, ...match.blueTeamNumbers]
          return {
            ...match,
            teams: teamNumbers.map((teamNumber) => {
              const team = teams.find((candidate) => candidate.teamNumber === teamNumber)
              const report = team
                ? reports.find(
                    (candidate) =>
                      candidate.matchId === match._id && candidate.teamId === team._id,
                  )
                : null
              const reservation = team
                ? reservations.find(
                    (candidate) =>
                      candidate.matchId === match._id &&
                      candidate.teamId === team._id &&
                      candidate.expiresAt > now,
                  )
                : null

              return {
                team,
                submitted: Boolean(report),
                reservedByMe: reservation?.userId === user.userId,
                reservedByOther: Boolean(reservation && reservation.userId !== user.userId),
                reservedByName: reservation?.userName ?? null,
              }
            }),
          }
        }),
    }
  },
})

export const reserveRobot = mutation({
  args: { matchId: v.id("matches"), teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    const match = await ctx.db.get(args.matchId)
    const team = await ctx.db.get(args.teamId)
    if (!match || !team || match.eventId !== team.eventId) {
      throw new Error("Invalid match or team.")
    }
    if (![...match.redTeamNumbers, ...match.blueTeamNumbers].includes(team.teamNumber)) {
      throw new Error("That team is not scheduled in this match.")
    }

    const existingReport = await ctx.db
      .query("matchReports")
      .withIndex("by_matchId_and_teamId", (q) =>
        q.eq("matchId", match._id).eq("teamId", team._id),
      )
      .first()
    if (existingReport) {
      throw new Error("This robot already has a submitted report for this match.")
    }

    const now = Date.now()
    const existing = await ctx.db
      .query("matchReservations")
      .withIndex("by_matchId_and_teamId", (q) =>
        q.eq("matchId", match._id).eq("teamId", team._id),
      )
      .first()

    if (existing && existing.userId !== user.userId && existing.expiresAt > now) {
      throw new Error(`${existing.userName} is already scouting this robot.`)
    }

    const reservation = {
      eventId: match.eventId,
      matchId: match._id,
      teamId: team._id,
      teamNumber: team.teamNumber,
      userId: user.userId,
      userName: user.name,
      expiresAt: now + RESERVATION_TTL_MS,
      updatedAt: now,
    }

    if (existing) {
      await ctx.db.patch(existing._id, reservation)
      return existing._id
    }

    return await ctx.db.insert("matchReservations", reservation)
  },
})

export const releaseReservation = mutation({
  args: { matchId: v.id("matches"), teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    const existing = await ctx.db
      .query("matchReservations")
      .withIndex("by_matchId_and_teamId", (q) =>
        q.eq("matchId", args.matchId).eq("teamId", args.teamId),
      )
      .first()

    if (existing && existing.userId === user.userId) {
      await ctx.db.delete(existing._id)
    }
  },
})

export const submitReport = mutation({
  args: {
    matchId: v.id("matches"),
    teamId: v.id("teams"),
    auto: scoreCountsValidator,
    autoNotes: v.string(),
    teleop: scoreCountsValidator,
    teleopNotes: v.string(),
    climb: climbValidator,
    endgameNotes: v.string(),
    driverRating: v.number(),
    defenseRating: v.number(),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    const match = await ctx.db.get(args.matchId)
    const team = await ctx.db.get(args.teamId)
    if (!match || !team || match.eventId !== team.eventId) {
      throw new Error("Invalid match or team.")
    }

    const reservation = await ctx.db
      .query("matchReservations")
      .withIndex("by_matchId_and_teamId", (q) =>
        q.eq("matchId", match._id).eq("teamId", team._id),
      )
      .first()
    const now = Date.now()
    if (reservation && reservation.userId !== user.userId && reservation.expiresAt > now) {
      throw new Error(`${reservation.userName} is already scouting this robot.`)
    }

    const existingReport = await ctx.db
      .query("matchReports")
      .withIndex("by_matchId_and_teamId", (q) =>
        q.eq("matchId", match._id).eq("teamId", team._id),
      )
      .first()

    const report = {
      eventId: match.eventId,
      matchId: match._id,
      teamId: team._id,
      teamNumber: team.teamNumber,
      matchNumber: match.matchNumber,
      scoutUserId: user.userId,
      auto: clampScores(args.auto),
      autoNotes: args.autoNotes.trim(),
      teleop: clampScores(args.teleop),
      teleopNotes: args.teleopNotes.trim(),
      climb: args.climb,
      endgameNotes: args.endgameNotes.trim(),
      driverRating: clampRating(args.driverRating),
      defenseRating: clampRating(args.defenseRating),
      tags: args.tags,
      updatedAt: now,
    }

    const reportId = existingReport
      ? (await ctx.db.patch(existingReport._id, report), existingReport._id)
      : await ctx.db.insert("matchReports", report)

    if (reservation && reservation.userId === user.userId) {
      await ctx.db.delete(reservation._id)
    }

    return reportId
  },
})

function clampRating(value: number) {
  return Math.max(1, Math.min(10, Math.round(value)))
}

function clampScores<T extends Record<string, number>>(scores: T) {
  return Object.fromEntries(
    Object.entries(scores).map(([key, value]) => [
      key,
      Math.max(0, Math.min(99, Math.round(value))),
    ]),
  ) as T
}
