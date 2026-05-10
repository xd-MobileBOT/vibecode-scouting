import { v } from "convex/values"

export const scoreCountsValidator = v.object({
  coralL1: v.number(),
  coralL2: v.number(),
  coralL3: v.number(),
  coralL4: v.number(),
  algaeHigh: v.number(),
  algaeLow: v.number(),
})

export const climbValidator = v.union(
  v.literal("none"),
  v.literal("low"),
  v.literal("high"),
)

export const pickTierValidator = v.union(
  v.literal("tier1"),
  v.literal("tier2"),
  v.literal("tier3"),
  v.literal("doNotPick"),
  v.literal("uncategorized"),
)
