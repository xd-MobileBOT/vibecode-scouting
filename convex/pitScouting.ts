import { v } from "convex/values"

import { mutation, query } from "./_generated/server"
import { requireUser } from "./authz"

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx)
    const event = await ctx.db
      .query("events")
      .withIndex("by_active", (q) => q.eq("active", true))
      .first()
    if (!event) {
      return { event: null, teams: [] }
    }

    const teams = await ctx.db
      .query("teams")
      .withIndex("by_eventId", (q) => q.eq("eventId", event._id))
      .collect()
    const reports = await ctx.db
      .query("pitReports")
      .withIndex("by_eventId", (q) => q.eq("eventId", event._id))
      .collect()

    return {
      event,
      teams: teams
        .sort((a, b) => a.teamNumber - b.teamNumber)
        .map((team) => ({
          ...team,
          pitReport: reports.find((report) => report.teamId === team._id) ?? null,
        })),
    }
  },
})

export const save = mutation({
  args: {
    teamId: v.id("teams"),
    coralL1: v.boolean(),
    coralL2: v.boolean(),
    coralL3: v.boolean(),
    coralL4: v.boolean(),
    algaeHigh: v.boolean(),
    algaeLow: v.boolean(),
    lowClimb: v.boolean(),
    highClimb: v.boolean(),
    drivetrain: v.string(),
    notes: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    const team = await ctx.db.get(args.teamId)
    if (!team) {
      throw new Error("Team not found.")
    }

    const now = Date.now()
    const existing = await ctx.db
      .query("pitReports")
      .withIndex("by_eventId_and_teamId", (q) =>
        q.eq("eventId", team.eventId).eq("teamId", team._id),
      )
      .first()

    const report = {
      eventId: team.eventId,
      teamId: team._id,
      teamNumber: team.teamNumber,
      scoutUserId: user.userId,
      coralL1: args.coralL1,
      coralL2: args.coralL2,
      coralL3: args.coralL3,
      coralL4: args.coralL4,
      algaeHigh: args.algaeHigh,
      algaeLow: args.algaeLow,
      lowClimb: args.lowClimb,
      highClimb: args.highClimb,
      drivetrain: args.drivetrain.trim(),
      notes: args.notes.trim(),
      updatedAt: now,
    }

    if (existing) {
      await ctx.db.patch(existing._id, report)
      return existing._id
    }

    return await ctx.db.insert("pitReports", report)
  },
})
