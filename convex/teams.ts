import { v } from "convex/values"

import { query } from "./_generated/server"
import { requireUser } from "./authz"
import { computeAverages } from "./aggregates"

export const listForActiveEvent = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx)
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
    const pitReports = await ctx.db
      .query("pitReports")
      .withIndex("by_eventId", (q) => q.eq("eventId", event._id))
      .collect()
    const matchReports = await ctx.db
      .query("matchReports")
      .withIndex("by_eventId", (q) => q.eq("eventId", event._id))
      .collect()
    const personalList = await ctx.db
      .query("pickLists")
      .withIndex("by_ownerUserId", (q) => q.eq("ownerUserId", user.userId))
      .filter((q) => q.eq(q.field("eventId"), event._id))
      .first()
    const pickItems = personalList
      ? await ctx.db
          .query("pickListItems")
          .withIndex("by_pickListId", (q) => q.eq("pickListId", personalList._id))
          .collect()
      : []

    return {
      event,
      teams: teams
        .sort((a, b) => a.teamNumber - b.teamNumber)
        .map((team) => {
          const reports = matchReports.filter((report) => report.teamId === team._id)
          const pickItem = pickItems.find((item) => item.teamId === team._id)

          return {
            ...team,
            pitScouted: pitReports.some((report) => report.teamId === team._id),
            matchReportCount: reports.length,
            pickTier: pickItem?.tier ?? "uncategorized",
            averages: computeAverages(reports),
          }
        }),
    }
  },
})

export const detail = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    const team = await ctx.db.get(args.teamId)
    if (!team) {
      return null
    }

    const pitReport = await ctx.db
      .query("pitReports")
      .withIndex("by_eventId_and_teamId", (q) =>
        q.eq("eventId", team.eventId).eq("teamId", team._id),
      )
      .first()
    const matchReports = await ctx.db
      .query("matchReports")
      .withIndex("by_eventId_and_teamId", (q) =>
        q.eq("eventId", team.eventId).eq("teamId", team._id),
      )
      .collect()
    const personalList = await ctx.db
      .query("pickLists")
      .withIndex("by_ownerUserId", (q) => q.eq("ownerUserId", user.userId))
      .filter((q) => q.eq(q.field("eventId"), team.eventId))
      .first()
    const pickItem = personalList
      ? await ctx.db
          .query("pickListItems")
          .withIndex("by_pickListId_and_teamId", (q) =>
            q.eq("pickListId", personalList._id).eq("teamId", team._id),
          )
          .first()
      : null

    return {
      team,
      pitReport,
      matchReports: matchReports.sort((a, b) => a.matchNumber - b.matchNumber),
      averages: computeAverages(matchReports),
      pickTier: pickItem?.tier ?? "uncategorized",
    }
  },
})
