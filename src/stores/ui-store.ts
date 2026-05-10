import { create } from "zustand"

type UiTab = "main" | "settings"

type UiState = {
  activeTab: UiTab
  sidebarOpen: boolean
  setActiveTab: (activeTab: UiTab) => void
  setSidebarOpen: (sidebarOpen: boolean) => void
  resetUiState: () => void
}

const initialState = {
  activeTab: "main" as const,
  sidebarOpen: false,
}

export const useUiStore = create<UiState>((set) => ({
  ...initialState,
  setActiveTab: (activeTab) => set({ activeTab }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  resetUiState: () => set(initialState),
}))
