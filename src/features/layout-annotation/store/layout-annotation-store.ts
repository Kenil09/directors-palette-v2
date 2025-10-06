import { create } from 'zustand'
import { CanvasState } from "../types"
import { INITIAL_CANVAS_STATE } from "../constants"

interface LayoutAnnotationState {
  isLoading: boolean
  canvasState: CanvasState
  error: string | null
  incomingImages: string[]
  initialImage: string | null
  sidebarCollapsed: boolean
  rightSidebarCollapsed: boolean

  setError: (error: string) => void
  setCanvasState: (updater: CanvasState | ((prev: CanvasState) => CanvasState)) => void
  setIncomingImages: (updater: string[] | ((prev: string[]) => string[])) => void
  setInitialImage: (initialImage: string | null) => void
  setSidebarCollapsed: (sidebarCollapsed: boolean) => void
  setRightSidebarCollapsed: (rightSidebarCollapsed: boolean) => void
}

export const useLayoutAnnotationStore = create<LayoutAnnotationState>()((set) => ({
  isLoading: false,
  canvasState: INITIAL_CANVAS_STATE,
  error: null,
  incomingImages: [],
  initialImage: null,
  sidebarCollapsed: false,
  rightSidebarCollapsed: false,

  setError: (error: string) => set({ error }),

  setCanvasState: (updater) =>
    set((state) => ({
      canvasState:
        typeof updater === "function"
          ? updater(state.canvasState)
          : updater,
    })),

  setIncomingImages: (updater) =>
    set((state) => ({
      incomingImages:
        typeof updater === "function"
          ? updater(state.incomingImages)
          : updater,
    })),

  setSidebarCollapsed: (sidebarCollapsed: boolean) => set({ sidebarCollapsed }),
  setRightSidebarCollapsed: (rightSidebarCollapsed: boolean) =>
    set({ rightSidebarCollapsed }),

  setInitialImage: (initialImage: string | null) => set({ initialImage }),
}))
