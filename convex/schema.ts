import { authTables } from "@convex-dev/auth/server"
import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

const scoreCounts = v.object({
  coralL1: v.number(),
  coralL2: v.number(),
  coralL3: v.number(),
  coralL4: v.number(),
  algaeHigh: v.number(),
  algaeLow: v.number(),
})

export default defineSchema({
  ...authTables,
  appSettings: defineTable({
    key: v.string(),
    value: v.string(),
    updatedByUserId: v.id("users"),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),
  events: defineTable({
    eventKey: v.string(),
    name: v.union(v.string(), v.null()),
    active: v.boolean(),
    importedByUserId: v.id("users"),
    importedAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_active", ["active"])
    .index("by_eventKey", ["eventKey"]),
  teams: defineTable({
    eventId: v.id("events"),
    tbaTeamKey: v.string(),
    teamNumber: v.number(),
    nickname: v.string(),
    city: v.union(v.string(), v.null()),
    stateProv: v.union(v.string(), v.null()),
    country: v.union(v.string(), v.null()),
  })
    .index("by_eventId", ["eventId"])
    .index("by_eventId_and_teamNumber", ["eventId", "teamNumber"])
    .index("by_eventId_and_tbaTeamKey", ["eventId", "tbaTeamKey"]),
  matches: defineTable({
    eventId: v.id("events"),
    tbaMatchKey: v.string(),
    matchNumber: v.number(),
    scheduledTime: v.union(v.number(), v.null()),
    redTeamNumbers: v.array(v.number()),
    blueTeamNumbers: v.array(v.number()),
  })
    .index("by_eventId", ["eventId"])
    .index("by_eventId_and_matchNumber", ["eventId", "matchNumber"])
    .index("by_eventId_and_tbaMatchKey", ["eventId", "tbaMatchKey"]),
  pitReports: defineTable({
    eventId: v.id("events"),
    teamId: v.id("teams"),
    teamNumber: v.number(),
    scoutUserId: v.id("users"),
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
    updatedAt: v.number(),
  })
    .index("by_eventId", ["eventId"])
    .index("by_eventId_and_teamId", ["eventId", "teamId"]),
  matchReservations: defineTable({
    eventId: v.id("events"),
    matchId: v.id("matches"),
    teamId: v.id("teams"),
    teamNumber: v.number(),
    userId: v.id("users"),
    userName: v.string(),
    expiresAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_eventId", ["eventId"])
    .index("by_matchId_and_teamId", ["matchId", "teamId"])
    .index("by_userId", ["userId"]),
  matchReports: defineTable({
    eventId: v.id("events"),
    matchId: v.id("matches"),
    teamId: v.id("teams"),
    teamNumber: v.number(),
    matchNumber: v.number(),
    scoutUserId: v.id("users"),
    auto: scoreCounts,
    autoNotes: v.string(),
    teleop: scoreCounts,
    teleopNotes: v.string(),
    climb: v.union(v.literal("none"), v.literal("low"), v.literal("high")),
    endgameNotes: v.string(),
    driverRating: v.number(),
    defenseRating: v.number(),
    tags: v.array(v.string()),
    updatedAt: v.number(),
  })
    .index("by_eventId", ["eventId"])
    .index("by_eventId_and_teamId", ["eventId", "teamId"])
    .index("by_matchId_and_teamId", ["matchId", "teamId"]),
  pickLists: defineTable({
    eventId: v.id("events"),
    type: v.union(v.literal("personal"), v.literal("primary")),
    name: v.string(),
    ownerUserId: v.union(v.id("users"), v.null()),
    createdByUserId: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_eventId", ["eventId"])
    .index("by_eventId_and_type", ["eventId", "type"])
    .index("by_ownerUserId", ["ownerUserId"]),
  pickListItems: defineTable({
    eventId: v.id("events"),
    pickListId: v.id("pickLists"),
    teamId: v.id("teams"),
    teamNumber: v.number(),
    tier: v.union(
      v.literal("tier1"),
      v.literal("tier2"),
      v.literal("tier3"),
      v.literal("doNotPick"),
      v.literal("uncategorized"),
    ),
    order: v.number(),
  })
    .index("by_pickListId", ["pickListId"])
    .index("by_pickListId_and_tier_and_order", ["pickListId", "tier", "order"])
    .index("by_pickListId_and_teamId", ["pickListId", "teamId"])
    .index("by_eventId_and_teamId", ["eventId", "teamId"]),
})
