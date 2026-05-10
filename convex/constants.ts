export const PICK_TIERS = [
  "tier1",
  "tier2",
  "tier3",
  "doNotPick",
  "uncategorized",
] as const

export const CLIMB_VALUES = ["none", "low", "high"] as const

export const MATCH_TAGS = [
  "Fast",
  "Accurate",
  "Good driver",
  "Plays defense",
  "Tippy",
  "Broke down",
  "Inconsistent",
] as const

export const RESERVATION_TTL_MS = 15 * 60 * 1000

export const SCORE_KEYS = [
  "coralL1",
  "coralL2",
  "coralL3",
  "coralL4",
  "algaeHigh",
  "algaeLow",
] as const
