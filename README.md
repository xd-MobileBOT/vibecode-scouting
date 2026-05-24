<<<<<<< HEAD
# vibecode-scouting
=======
# New Project

Framework baseline using Bun, Vite, React, React Router 7, TypeScript, Tailwind CSS v4, shadcn/ui with Base UI, Convex, Convex Auth, Zustand, next-themes, Lucide icons, and shadcn Sonner.

## Run In Codex

Use the Codex **Run** action. It calls `codex-run.ps1`, which resolves Bun and Bunx from `C:\Users\__\.bun\bin`, starts Convex and Vite as separate processes, and avoids relying on Bun being picked up by `PATH`.
The Vite dev script also removes `node_modules\.vite-temp` before startup to avoid stale temp-directory failures after an interrupted run.

From a terminal in this folder, either command works:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\codex-run.ps1
```

```cmd
codex-run.cmd
```

Once Bun is on your user `PATH`, this also works:

```powershell
bun run codex:run
```

## Scripts

```powershell
bun run dev
bun run typecheck
bun run lint
bun run build
bunx convex dev --once
```
>>>>>>> ae6ca06 (init commit from codex)
