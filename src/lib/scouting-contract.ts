export const pickTiers = [
  { value: "tier1", label: "Tier 1" },
  { value: "tier2", label: "Tier 2" },
  { value: "tier3", label: "Tier 3" },
  { value: "doNotPick", label: "Do Not Pick" },
  { value: "uncategorized", label: "Uncategorized" },
] as const

export const climbOptions = [
  { value: "none", label: "No climb" },
  { value: "low", label: "Low climb" },
  { value: "high", label: "High climb" },
] as const

export const matchTags = [
  "Fast",
  "Accurate",
  "Good driver",
  "Plays defense",
  "Tippy",
  "Broke down",
  "Inconsistent",
] as const

export const scoreFields = [
  { key: "coralL1", label: "Coral L1" },
  { key: "coralL2", label: "Coral L2" },
  { key: "coralL3", label: "Coral L3" },
  { key: "coralL4", label: "Coral L4" },
  { key: "algaeHigh", label: "Algae High" },
  { key: "algaeLow", label: "Algae Low" },
] as const

export type PickTier = (typeof pickTiers)[number]["value"]
export type ClimbResult = (typeof climbOptions)[number]["value"]
export type ScoreKey = (typeof scoreFields)[number]["key"]

export type ScoreCounts = Record<ScoreKey, number>

export const emptyScoreCounts = (): ScoreCounts => ({
  coralL1: 0,
  coralL2: 0,
  coralL3: 0,
  coralL4: 0,
  algaeHigh: 0,
  algaeLow: 0,
})
