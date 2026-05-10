import type { Doc } from "./_generated/dataModel"
import type { TeamAverages } from "./contract"

export function emptyAverages(): TeamAverages {
  return {
    autoCoral: 0,
    teleopCoral: 0,
    autoAlgae: 0,
    teleopAlgae: 0,
    driverRating: 0,
    teleopCoralL4: 0,
    climbScore: 0,
  }
}

export function computeAverages(reports: Doc<"matchReports">[]): TeamAverages {
  if (reports.length === 0) {
    return emptyAverages()
  }

  const totals = reports.reduce(
    (acc, report) => {
      acc.autoCoral +=
        report.auto.coralL1 +
        report.auto.coralL2 +
        report.auto.coralL3 +
        report.auto.coralL4
      acc.teleopCoral +=
        report.teleop.coralL1 +
        report.teleop.coralL2 +
        report.teleop.coralL3 +
        report.teleop.coralL4
      acc.autoAlgae += report.auto.algaeHigh + report.auto.algaeLow
      acc.teleopAlgae += report.teleop.algaeHigh + report.teleop.algaeLow
      acc.driverRating += report.driverRating
      acc.teleopCoralL4 += report.teleop.coralL4
      acc.climbScore += report.climb === "high" ? 2 : report.climb === "low" ? 1 : 0
      return acc
    },
    emptyAverages(),
  )

  return {
    autoCoral: roundAverage(totals.autoCoral, reports.length),
    teleopCoral: roundAverage(totals.teleopCoral, reports.length),
    autoAlgae: roundAverage(totals.autoAlgae, reports.length),
    teleopAlgae: roundAverage(totals.teleopAlgae, reports.length),
    driverRating: roundAverage(totals.driverRating, reports.length),
    teleopCoralL4: roundAverage(totals.teleopCoralL4, reports.length),
    climbScore: roundAverage(totals.climbScore, reports.length),
  }
}

function roundAverage(total: number, count: number) {
  return Math.round((total / count) * 10) / 10
}
