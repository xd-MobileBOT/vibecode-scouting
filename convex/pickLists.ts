import { v } from "convex/values"

import { mutation, query } from "./_generated/server"
import { requireAdmin, requireUser } from "./authz"
import { computeAverages } from "./aggregates"
import { pickTierValidator } from "./validators"
import type { Doc, Id } from "./_generated/dataModel"
import type { PickTier } from "./contract"

const tierWeight: Record<PickTier, number> = {
  tier1: 0,
  tier2: 100,
  tier3: 200,
  uncategorized: 400,
  doNotPick: 1000,
}

const tierLabels: Record<PickTier, string> = {
  tier1: "Tier 1",
  tier2: "Tier 2",
  tier3: "Tier 3",
  doNotPick: "Do Not Pick",
  uncategorized: "Uncategorized",
}

export const landing = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx)
    const event = await ctx.db
      .query("events")
      .withIndex("by_active", (q) => q.eq("active", true))
      .first()
    if (!event) {
      return { event: null, personalLists: [], primaryList: null }
    }

    const personalLists = await ctx.db
      .query("pickLists")
      .withIndex("by_ownerUserId", (q) => q.eq("ownerUserId", user.userId))
      .filter((q) => q.eq(q.field("eventId"), event._id))
      .collect()
    const primaryList = await ctx.db
      .query("pickLists")
      .withIndex("by_eventId_and_type", (q) =>
        q.eq("eventId", event._id).eq("type", "primary"),
      )
      .first()

    return {
      event,
      personalLists: personalLists.sort((a, b) => a.createdAt - b.createdAt),
      primaryList,
    }
  },
})

export const board = query({
  args: { pickListId: v.id("pickLists") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    const list = await ctx.db.get(args.pickListId)
    if (!list) {
      return null
    }
    if (list.type === "personal" && list.ownerUserId !== user.userId) {
      throw new Error("You can only view your own personal pick lists.")
    }

    const teams = await ctx.db
      .query("teams")
      .withIndex("by_eventId", (q) => q.eq("eventId", list.eventId))
      .collect()
    const pitReports = await ctx.db
      .query("pitReports")
      .withIndex("by_eventId", (q) => q.eq("eventId", list.eventId))
      .collect()
    const matchReports = await ctx.db
      .query("matchReports")
      .withIndex("by_eventId", (q) => q.eq("eventId", list.eventId))
      .collect()
    const items = await ctx.db
      .query("pickListItems")
      .withIndex("by_pickListId", (q) => q.eq("pickListId", list._id))
      .collect()

    return {
      list,
      columns: (Object.keys(tierLabels) as PickTier[]).map((tier) => ({
        tier,
        label: tierLabels[tier],
        items: items
          .filter((item) => item.tier === tier)
          .sort((a, b) => a.order - b.order)
          .map((item) => {
            const team = teams.find((candidate) => candidate._id === item.teamId)
            const reports = matchReports.filter(
              (report) => report.teamId === item.teamId,
            )
            return {
              ...item,
              team,
              pitScouted: pitReports.some((report) => report.teamId === item.teamId),
              averages: computeAverages(reports),
            }
          }),
      })),
      availableTeams: teams
        .filter((team) => !items.some((item) => item.teamId === team._id))
        .sort((a, b) => a.teamNumber - b.teamNumber),
    }
  },
})

export const createPersonal = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    const event = await activeEventOrThrow(ctx)
    const now = Date.now()
    const listId = await ctx.db.insert("pickLists", {
      eventId: event._id,
      type: "personal",
      name: args.name.trim() || "My Pick List",
      ownerUserId: user.userId,
      createdByUserId: user.userId,
      createdAt: now,
      updatedAt: now,
    })

    await addAllTeamsToList(ctx, event._id, listId)
    return listId
  },
})

export const ensurePrimary = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireAdmin(ctx)
    const event = await activeEventOrThrow(ctx)
    const existing = await ctx.db
      .query("pickLists")
      .withIndex("by_eventId_and_type", (q) =>
        q.eq("eventId", event._id).eq("type", "primary"),
      )
      .first()
    if (existing) {
      return existing._id
    }

    const now = Date.now()
    return await ctx.db.insert("pickLists", {
      eventId: event._id,
      type: "primary",
      name: "Primary Pick List",
      ownerUserId: null,
      createdByUserId: user.userId,
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const addTeamToPrimary = mutation({
  args: { teamId: v.id("teams"), tier: pickTierValidator },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const team = await ctx.db.get(args.teamId)
    if (!team) {
      throw new Error("Team not found.")
    }
    const primaryId = await primaryListIdOrThrow(ctx, team.eventId)
    await upsertPickItem(ctx, primaryId, team, args.tier)
  },
})

export const moveTeam = mutation({
  args: {
    pickListId: v.id("pickLists"),
    teamId: v.id("teams"),
    tier: pickTierValidator,
    order: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    const list = await ctx.db.get(args.pickListId)
    const team = await ctx.db.get(args.teamId)
    if (!list || !team || list.eventId !== team.eventId) {
      throw new Error("Invalid pick list move.")
    }
    if (list.type === "primary") {
      await requireAdmin(ctx)
    } else if (list.ownerUserId !== user.userId) {
      throw new Error("You can only edit your own pick lists.")
    }

    await upsertPickItem(ctx, list._id, team, args.tier, args.order)
    await ctx.db.patch(list._id, { updatedAt: Date.now() })
  },
})

export const importConsensusToPrimary = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireAdmin(ctx)
    const event = await activeEventOrThrow(ctx)
    const primaryId = await primaryListIdOrCreate(ctx, event._id, user.userId)
    const teams = await ctx.db
      .query("teams")
      .withIndex("by_eventId", (q) => q.eq("eventId", event._id))
      .collect()
    const personalLists = await ctx.db
      .query("pickLists")
      .withIndex("by_eventId_and_type", (q) =>
        q.eq("eventId", event._id).eq("type", "personal"),
      )
      .collect()
    const allItems = await Promise.all(
      personalLists.map((list) =>
        ctx.db
          .query("pickListItems")
          .withIndex("by_pickListId", (q) => q.eq("pickListId", list._id))
          .collect(),
      ),
    )

    const scored = teams
      .map((team) => {
        const scores = allItems.map((items) => {
          const item = items.find((candidate) => candidate.teamId === team._id)
          return item ? tierWeight[item.tier] + item.order : 600
        })
        const average =
          scores.length === 0
            ? 600
            : scores.reduce((sum, score) => sum + score, 0) / scores.length
        return { team, average }
      })
      .sort((a, b) => a.average - b.average || a.team.teamNumber - b.team.teamNumber)

    const existingPrimaryItems = await ctx.db
      .query("pickListItems")
      .withIndex("by_pickListId", (q) => q.eq("pickListId", primaryId))
      .collect()
    for (const item of existingPrimaryItems) {
      await ctx.db.delete(item._id)
    }

    const tierSize = Math.max(1, Math.ceil(scored.length / 3))
    for (const [index, entry] of scored.entries()) {
      const tier: PickTier =
        entry.average >= 900
          ? "doNotPick"
          : index < tierSize
            ? "tier1"
            : index < tierSize * 2
              ? "tier2"
              : "tier3"
      await ctx.db.insert("pickListItems", {
        eventId: event._id,
        pickListId: primaryId,
        teamId: entry.team._id,
        teamNumber: entry.team.teamNumber,
        tier,
        order: index,
      })
    }

    await ctx.db.patch(primaryId, { updatedAt: Date.now() })
    return primaryId
  },
})

async function activeEventOrThrow(ctx: { db: any }) {
  const event = await ctx.db
    .query("events")
    .withIndex("by_active", (q: any) => q.eq("active", true))
    .first()
  if (!event) {
    throw new Error("Import an event first.")
  }
  return event as Doc<"events">
}

async function primaryListIdOrThrow(ctx: { db: any }, eventId: Id<"events">) {
  const list = await ctx.db
    .query("pickLists")
    .withIndex("by_eventId_and_type", (q: any) =>
      q.eq("eventId", eventId).eq("type", "primary"),
    )
    .first()
  if (!list) {
    throw new Error("Create the primary pick list first.")
  }
  return list._id as Id<"pickLists">
}

async function primaryListIdOrCreate(
  ctx: { db: any },
  eventId: Id<"events">,
  userId: Id<"users">,
) {
  const existing = await ctx.db
    .query("pickLists")
    .withIndex("by_eventId_and_type", (q: any) =>
      q.eq("eventId", eventId).eq("type", "primary"),
    )
    .first()
  if (existing) {
    return existing._id as Id<"pickLists">
  }

  const now = Date.now()
  return (await ctx.db.insert("pickLists", {
    eventId,
    type: "primary",
    name: "Primary Pick List",
    ownerUserId: null,
    createdByUserId: userId,
    createdAt: now,
    updatedAt: now,
  })) as Id<"pickLists">
}

async function addAllTeamsToList(
  ctx: { db: any },
  eventId: Id<"events">,
  pickListId: Id<"pickLists">,
) {
  const teams = await ctx.db
    .query("teams")
    .withIndex("by_eventId", (q: any) => q.eq("eventId", eventId))
    .collect()

  for (const [index, team] of teams
    .sort((a: Doc<"teams">, b: Doc<"teams">) => a.teamNumber - b.teamNumber)
    .entries()) {
    await ctx.db.insert("pickListItems", {
      eventId,
      pickListId,
      teamId: team._id,
      teamNumber: team.teamNumber,
      tier: "uncategorized",
      order: index,
    })
  }
}

async function upsertPickItem(
  ctx: { db: any },
  pickListId: Id<"pickLists">,
  team: Doc<"teams">,
  tier: PickTier,
  order?: number,
) {
  const existing = await ctx.db
    .query("pickListItems")
    .withIndex("by_pickListId_and_teamId", (q: any) =>
      q.eq("pickListId", pickListId).eq("teamId", team._id),
    )
    .first()
  const nextOrder =
    order ??
    (await nextOrderForTier(ctx, pickListId, tier))

  if (existing) {
    await ctx.db.patch(existing._id, { tier, order: nextOrder })
  } else {
    await ctx.db.insert("pickListItems", {
      eventId: team.eventId,
      pickListId,
      teamId: team._id,
      teamNumber: team.teamNumber,
      tier,
      order: nextOrder,
    })
  }
}

async function nextOrderForTier(
  ctx: { db: any },
  pickListId: Id<"pickLists">,
  tier: PickTier,
) {
  const items = await ctx.db
    .query("pickListItems")
    .withIndex("by_pickListId_and_tier_and_order", (q: any) =>
      q.eq("pickListId", pickListId).eq("tier", tier),
    )
    .collect()
  return Math.max(-1, ...items.map((item: Doc<"pickListItems">) => item.order)) + 1
}
