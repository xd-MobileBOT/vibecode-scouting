export type PickTier =
  | "tier1"
  | "tier2"
  | "tier3"
  | "doNotPick"
  | "uncategorized"

export type ClimbResult = "none" | "low" | "high"

export type ScoreCounts = {
  coralL1: number
  coralL2: number
  coralL3: number
  coralL4: number
  algaeHigh: number
  algaeLow: number
}

export type TeamAverages = {
  autoCoral: number
  teleopCoral: number
  autoAlgae: number
  teleopAlgae: number
  driverRating: number
  teleopCoralL4: number
  climbScore: number
}
