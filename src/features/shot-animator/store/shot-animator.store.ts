/**
 * Shot Animator Store
 *
 * Centralized state management for Shot Animator feature
 */

import { create } from 'zustand'
import type { ShotAnimationConfig } from '../types'

interface ShotAnimatorStore {
  // State
  shotConfigs: ShotAnimationConfig[]

  // Actions
  addShotConfig: (config: ShotAnimationConfig) => void
  addShotConfigs: (configs: ShotAnimationConfig[]) => void
  updateShotConfig: (id: string, updates: Partial<ShotAnimationConfig>) => void
  removeShotConfig: (id: string) => void
  setShotConfigs: (configs: ShotAnimationConfig[]) => void
  clearShotConfigs: () => void
}

export const useShotAnimatorStore = create<ShotAnimatorStore>((set) => ({
  shotConfigs: [],

  addShotConfig: (config) =>
    set((state) => ({
      shotConfigs: [...state.shotConfigs, config],
    })),

  addShotConfigs: (configs) =>
    set((state) => {
      // Avoid duplicates by checking IDs
      const existingIds = new Set(state.shotConfigs.map((s) => s.id))
      const newConfigs = configs.filter((c) => !existingIds.has(c.id))
      return {
        shotConfigs: [...state.shotConfigs, ...newConfigs],
      }
    }),

  updateShotConfig: (id, updates) =>
    set((state) => ({
      shotConfigs: state.shotConfigs.map((config) =>
        config.id === id ? { ...config, ...updates } : config
      ),
    })),

  removeShotConfig: (id) =>
    set((state) => ({
      shotConfigs: state.shotConfigs.filter((config) => config.id !== id),
    })),

  setShotConfigs: (configs) =>
    set({ shotConfigs: configs }),

  clearShotConfigs: () =>
    set({ shotConfigs: [] }),
}))
