import { getAuthUserId } from "@convex-dev/auth/server"

import type { ActionCtx, MutationCtx, QueryCtx } from "./_generated/server"
import type { Id } from "./_generated/dataModel"

type Ctx = QueryCtx | MutationCtx | ActionCtx

export async function requireUser(ctx: Ctx): Promise<{
  userId: Id<"users">
  email: string
  name: string
}> {
  const userId = await getAuthUserId(ctx)
  const identity = await ctx.auth.getUserIdentity()

  if (userId === null || identity === null) {
    throw new Error("You must be signed in.")
  }

  const email = identity.email?.toLowerCase()
  if (!email) {
    throw new Error("Your account needs an email address.")
  }

  return {
    userId,
    email,
    name: identity.name ?? email,
  }
}

export function isAdminEmail(email: string) {
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)

  return admins.includes(email.toLowerCase())
}

export async function requireAdmin(ctx: Ctx) {
  const user = await requireUser(ctx)

  if (!isAdminEmail(user.email)) {
    throw new Error("Admin access required.")
  }

  return user
}
