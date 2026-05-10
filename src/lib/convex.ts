import { ConvexReactClient } from "convex/react"

const convexUrl = import.meta.env.VITE_CONVEX_URL

if (!convexUrl) {
  throw new Error(
    "Missing VITE_CONVEX_URL. Run `bun run convex:dev` once to configure Convex."
  )
}

export const convex = new ConvexReactClient(convexUrl)
