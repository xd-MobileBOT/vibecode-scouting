import { useAuthActions } from "@convex-dev/auth/react"
import { Loader2Icon, LogInIcon, UserPlusIcon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type AuthMode = "signIn" | "signUp"

export function AuthForm() {
  const { signIn } = useAuthActions()
  const [mode, setMode] = useState<AuthMode>("signIn")
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(event.currentTarget)
    formData.set("flow", mode)

    try {
      await signIn("password", formData)
      toast.success(mode === "signIn" ? "Signed in" : "Account created")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Authentication failed")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full rounded-lg border bg-card p-4 text-card-foreground shadow-sm"
    >
      <div className="mb-4 space-y-1">
        <h2 className="text-lg font-semibold">
          {mode === "signIn" ? "Sign in" : "Create account"}
        </h2>
        <p className="text-sm text-muted-foreground">
          Use the team scouting account for this event.
        </p>
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="auth-email">Email</Label>
          <Input
            id="auth-email"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="auth-password">Password</Label>
          <Input
            id="auth-password"
            name="password"
            type="password"
            autoComplete={mode === "signIn" ? "current-password" : "new-password"}
            required
          />
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
          {isSubmitting ? (
            <Loader2Icon className="animate-spin" />
          ) : mode === "signIn" ? (
            <LogInIcon />
          ) : (
            <UserPlusIcon />
          )}
          {mode === "signIn" ? "Sign in" : "Sign up"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={isSubmitting}
          onClick={() => setMode(mode === "signIn" ? "signUp" : "signIn")}
          className="w-full sm:w-auto"
        >
          {mode === "signIn" ? "Need an account?" : "Have an account?"}
        </Button>
      </div>
    </form>
  )
}
