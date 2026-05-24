import { createBrowserRouter } from "react-router"

import { EventSetupRoute } from "@/routes/event-setup"
import { HomeRoute } from "@/routes/home"
import { MatchScoutingRoute } from "@/routes/match-scouting"
import { PickListsRoute } from "@/routes/pick-lists"
import { PitScoutingRoute } from "@/routes/pit-scouting"
import { RootLayout } from "@/routes/root-layout"
import { TeamsRoute } from "@/routes/teams"

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <HomeRoute />,
      },
      {
        path: "event-setup",
        element: <EventSetupRoute />,
      },
      {
        path: "teams",
        element: <TeamsRoute />,
      },
      {
        path: "pit-scouting",
        element: <PitScoutingRoute />,
      },
      {
        path: "match-scouting",
        element: <MatchScoutingRoute />,
      },
      {
        path: "pick-lists",
        element: <PickListsRoute />,
      },
    ],
  },
])
