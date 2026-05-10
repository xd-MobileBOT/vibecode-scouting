import { v } from "convex/values"

import { query } from "./_generated/server"
import { requireAdmin, requireUser, isAdminEmail } from "./authz"

export const active = query({
  args: {},
  handler: async (ctx) => {
    const events = await ctx.db
      .query("events")
      .withIndex("by_active", (q) => q.eq("active", true))
      .collect()

    return events[0] ?? null
  },
})

export const viewer = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null || !identity.email) {
      return {
        isAuthenticated: false,
        isAdmin: false,
        email: null,
        name: null,
      }
    }

    return {
      isAuthenticated: true,
      isAdmin: isAdminEmail(identity.email),
      email: identity.email,
      name: identity.name ?? identity.email,
    }
  },
})

export const assertSignedIn = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx)
    return user
  },
})

export const assertAdmin = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAdmin(ctx)
    return user
  },
})

export const byId = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    await requireUser(ctx)
    return await ctx.db.get(args.eventId)
  },
})
