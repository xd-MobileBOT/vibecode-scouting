import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const themeModes = [
  { value: "light", label: "Light", icon: SunIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
  { value: "system", label: "System", icon: MonitorIcon },
]

export function ThemeModeMenu() {
  const { setTheme, theme = "system" } = useTheme()
  const activeMode = themeModes.find((mode) => mode.value === theme) ?? themeModes[2]
  const ActiveIcon = activeMode.icon

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger render={<DropdownMenuTrigger render={<Button variant="outline" size="icon" />} />}>
          <ActiveIcon />
          <span className="sr-only">Theme mode</span>
        </TooltipTrigger>
        <TooltipContent>Theme mode</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={(value) => setTheme(value)}
        >
          {themeModes.map((mode) => {
            const Icon = mode.icon

            return (
              <DropdownMenuRadioItem key={mode.value} value={mode.value}>
                <Icon />
                {mode.label}
              </DropdownMenuRadioItem>
            )
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
