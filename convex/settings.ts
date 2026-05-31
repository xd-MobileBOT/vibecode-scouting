import { v } from "convex/values"

import {
  internalMutation,
  internalQuery,
  mutation,
  query,
  type MutationCtx,
} from "./_generated/server"
import type { Id } from "./_generated/dataModel"
import { requireAdmin } from "./authz"

const TBA_API_KEY_SETTING = "tbaApiKey"

export const adminStatus = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx)
    const setting = await ctx.db
      .query("appSettings")
      .withIndex("by_key", (q) => q.eq("key", TBA_API_KEY_SETTING))
      .first()

    return {
      hasTbaApiKey: Boolean(setting?.value),
      tbaApiKeyUpdatedAt: setting?.updatedAt ?? null,
    }
  },
})

export const saveTbaApiKey = mutation({
  args: { apiKey: v.string() },
  handler: async (ctx, args) => {
    const user = await requireAdmin(ctx)
    const apiKey = args.apiKey.trim()

    if (apiKey.length < 16) {
      throw new Error("Enter a valid TBA API key.")
    }

    const updatedAt = Date.now()
    await upsertSettingValue(ctx, {
      key: TBA_API_KEY_SETTING,
      value: apiKey,
      updatedByUserId: user.userId,
      updatedAt,
    })

    return {
      hasTbaApiKey: true,
      tbaApiKeyUpdatedAt: updatedAt,
    }
  },
})

export const getTbaApiKey = internalQuery({
  args: {},
  handler: async (ctx) => {
    const setting = await ctx.db
      .query("appSettings")
      .withIndex("by_key", (q) => q.eq("key", TBA_API_KEY_SETTING))
      .first()

    return setting?.value ?? null
  },
})

export const upsertSettingForMigration = internalMutation({
  args: {
    key: v.string(),
    value: v.string(),
    updatedByUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await upsertSettingValue(ctx, {
      ...args,
      updatedAt: Date.now(),
    })
  },
})

export const saveTbaApiKeyFromImport = internalMutation({
  args: {
    apiKey: v.string(),
    updatedByUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await upsertSettingValue(ctx, {
      key: TBA_API_KEY_SETTING,
      value: args.apiKey.trim(),
      updatedByUserId: args.updatedByUserId,
      updatedAt: Date.now(),
    })
  },
})

export const clearTbaApiKey = internalMutation({
  args: {},
  handler: async (ctx) => {
    const setting = await ctx.db
      .query("appSettings")
      .withIndex("by_key", (q) => q.eq("key", TBA_API_KEY_SETTING))
      .first()

    if (setting) {
      await ctx.db.delete(setting._id)
    }

    return null
  },
})

async function upsertSettingValue(
  ctx: MutationCtx,
  args: {
    key: string
    value: string
    updatedByUserId: Id<"users">
    updatedAt: number
  },
) {
  const existing = await ctx.db
    .query("appSettings")
    .withIndex("by_key", (q) => q.eq("key", args.key))
    .first()

  if (existing) {
    await ctx.db.patch(existing._id, {
      value: args.value,
      updatedByUserId: args.updatedByUserId,
      updatedAt: args.updatedAt,
    })
    return existing._id
  }

  return await ctx.db.insert("appSettings", args)
}
