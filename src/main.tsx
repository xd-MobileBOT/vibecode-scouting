import { ConvexAuthProvider } from "@convex-dev/auth/react"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { RouterProvider } from "react-router"
import { SpeedInsights } from "@vercel/speed-insights/react"

import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { convex } from "@/lib/convex"
import { router } from "@/router"
import "@/index.css"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConvexAuthProvider client={convex}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <TooltipProvider>
          <RouterProvider router={router} />
        </TooltipProvider>
      </ThemeProvider>
    </ConvexAuthProvider>
    <SpeedInsights />
  </StrictMode>
)
