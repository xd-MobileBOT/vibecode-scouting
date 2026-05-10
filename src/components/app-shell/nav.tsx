import { useAuthActions, useConvexAuth } from "@convex-dev/auth/react"
import { Link, useLocation } from "react-router"
import { LogOutIcon, SettingsIcon, TrophyIcon, UsersIcon } from "lucide-react"
import { toast } from "sonner"

import { ThemeModeMenu } from "@/components/theme-mode-menu"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type AppShellNavProps = {
  viewer?: {
    isAdmin: boolean
    email: string | null
    name: string | null
  } | null
}

const primaryLinks = [
  { to: "/", label: "Dashboard", icon: TrophyIcon },
  { to: "/teams", label: "Teams", icon: UsersIcon },
]

export function AppShellNav({ viewer }: AppShellNavProps) {
  const { isAuthenticated } = useConvexAuth()
  const { signOut } = useAuthActions()
  const location = useLocation()

  async function handleSignOut() {
    await signOut()
    toast.success("Signed out")
  }

  const links = viewer?.isAdmin
    ? [...primaryLinks, { to: "/event-setup", label: "Event", icon: SettingsIcon }]
    : primaryLinks

  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-2 px-4 sm:px-6">
        <Link
          to="/"
          className="flex min-w-0 items-center gap-2 rounded-md text-sm font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            FRC
          </span>
          <span className="hidden sm:inline">Scouting</span>
        </Link>

        <nav className="ml-1 flex flex-1 items-center gap-1 overflow-x-auto sm:ml-4">
          {links.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.to
            return (
              <Button
                key={item.to}
                render={<Link to={item.to} />}
                variant={isActive ? "secondary" : "ghost"}
                size="sm"
                className={cn("gap-1.5", isActive && "font-semibold")}
              >
                <Icon />
                {item.label}
              </Button>
            )
          })}
        </nav>

        <div className="flex items-center gap-1">
          <ThemeModeMenu />
          {isAuthenticated && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={handleSignOut}
              title={viewer?.email ?? "Sign out"}
            >
              <LogOutIcon />
              <span className="sr-only">Sign out</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
