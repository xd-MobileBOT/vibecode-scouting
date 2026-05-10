# Backend Contract

Convex owns all persisted scouting data. Frontend code must not invent tables,
function names, or write semantics. If a UI needs backend behavior that is not
listed here, stop and update this contract first.

## Auth

- Users sign in with Convex Auth password provider.
- Backend derives user identity with Convex Auth; clients never pass user ids.
- Admin access is granted when the authenticated email is in Convex env
  `ADMIN_EMAILS`.

## Environment

- `TBA_API_KEY`: The Blue Alliance Read API key.
- `ADMIN_EMAILS`: comma-separated admin email allowlist.

## Public Convex API

- `events.viewer`: current auth/admin state.
- `events.active`: active imported event.
- `tba.importEvent`: admin-only TBA team and qualification match import.
- `teams.listForActiveEvent`: team cards with pit status, report count, pick tier, averages.
- `teams.detail`: team detail modal data.
- `pitScouting.list`, `pitScouting.save`: pit dashboard and upsert.
- `matchScouting.landing`: match/team selector with reservation state.
- `matchScouting.reserveRobot`, `releaseReservation`, `submitReport`.
- `pickLists.landing`, `board`, `createPersonal`, `ensurePrimary`,
  `addTeamToPrimary`, `moveTeam`, `importConsensusToPrimary`.

## Canonical Values

- Pick tiers: `tier1`, `tier2`, `tier3`, `doNotPick`, `uncategorized`.
- Climb results: `none`, `low`, `high`.
- Tags: `Fast`, `Accurate`, `Good driver`, `Plays defense`, `Tippy`,
  `Broke down`, `Inconsistent`.
- Score fields: `coralL1`, `coralL2`, `coralL3`, `coralL4`, `algaeHigh`,
  `algaeLow`.

## Rules

- One active event at a time.
- TBA import upserts teams/matches and preserves scouting/pick list data.
- Personal pick lists start with all teams in `uncategorized`.
- Primary pick list starts blank and is admin-only.
- Match scouting uses live reservations with a 15 minute TTL.
- Consensus merge uses rank average with tier and missing-team penalties.
