import { getAuthUserId } from "@convex-dev/auth/server"

import { internal } from "./_generated/api"
import { internalQuery } from "./_generated/server"
import type { ActionCtx, MutationCtx, QueryCtx } from "./_generated/server"
import type { Doc, Id } from "./_generated/dataModel"

type Ctx = QueryCtx | MutationCtx | ActionCtx
type DbCtx = QueryCtx | MutationCtx
type AuthenticatedUser = {
  userId: Id<"users">
  email: string
  name: string
}

export const currentUserProfile = internalQuery({
  args: {},
  handler: async (ctx): Promise<AuthenticatedUser | null> => {
    return await getCurrentUserFromDb(ctx)
  },
})

export async function requireUser(ctx: Ctx): Promise<AuthenticatedUser> {
  const user =
    "db" in ctx
      ? await getCurrentUserFromDb(ctx)
      : await ctx.runQuery(internal.authz.currentUserProfile, {})

  if (user === null) {
    throw new Error("You must be signed in.")
  }

  return user
}

export async function getCurrentUser(
  ctx: DbCtx,
): Promise<AuthenticatedUser | null> {
  return await getCurrentUserFromDb(ctx)
}

async function getCurrentUserFromDb(
  ctx: DbCtx,
): Promise<AuthenticatedUser | null> {
  const userId = await getAuthUserId(ctx)
  const identity = await ctx.auth.getUserIdentity()

  if (userId === null) {
    return null
  }

  const user = await ctx.db.get(userId)
  const email = (identity?.email ?? user?.email)?.toLowerCase()
  if (!email) {
    throw new Error("Your account needs an email address.")
  }

  return {
    userId,
    email,
    name: displayName(identity?.name, user, email),
  }
}

export function isAdminEmail(email: string) {
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((value: string) => value.trim().toLowerCase())
    .filter(Boolean)

  if (admins.length === 0) {
    return true
  }

  return admins.includes(email.toLowerCase())
}

function displayName(
  identityName: string | undefined,
  user: Doc<"users"> | null,
  email: string,
) {
  const name = identityName ?? user?.name

  return name && name.trim().length > 0 ? name : email
}

export async function requireAdmin(ctx: Ctx) {
  const user = await requireUser(ctx)

  if (!isAdminEmail(user.email)) {
    throw new Error("Admin access required.")
  }

  return user
}
