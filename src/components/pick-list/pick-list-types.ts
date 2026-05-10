import type { FunctionReturnType } from "convex/server"

import { api } from "../../../convex/_generated/api"

export type PickListBoardData = NonNullable<
  FunctionReturnType<typeof api.pickLists.board>
>

export type PickListColumnData = PickListBoardData["columns"][number]
export type PickListItem = PickListColumnData["items"][number]
