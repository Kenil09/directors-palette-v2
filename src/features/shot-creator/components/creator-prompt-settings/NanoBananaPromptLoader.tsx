'use client'

import { NANO_BANANA_PROMPTS } from "@/features/shot-creator/constants/prompt-library-presets"
import { useEffect } from 'react'
import { SavedPrompt, usePromptLibraryStore } from "../../store/prompt-library-store"

// Module-level singleton pattern with Promise-based initialization
class PromptLoaderSingleton {
  private static instance: PromptLoaderSingleton | undefined
  private initializationPromise: Promise<void> | null = null
  private hasInitialized = false

  private constructor() { }

  public static getInstance(): PromptLoaderSingleton {
    if (!PromptLoaderSingleton.instance) {
      PromptLoaderSingleton.instance = new PromptLoaderSingleton()
    }
    return PromptLoaderSingleton.instance! // We know this isn't undefined after the check above
  }

  public async initialize(): Promise<void> {
    // If already initialized or initialization in progress, return the promise
    if (this.hasInitialized) {
      return Promise.resolve()
    }

    if (this.initializationPromise) {
      return this.initializationPromise
    }

    // Start initialization and store the promise
    this.initializationPromise = this.performInitialization()
    return this.initializationPromise
  }

  private async performInitialization(): Promise<void> {
    try {
      console.log('🔄 NanoBananaPromptLoader: Starting initialization...')

      // Clear any existing duplicates first
      await this.clearDuplicatePrompts()

      // Check for browser environment before accessing localStorage
      if (typeof window === 'undefined') {
        console.log('⏭️ NanoBananaPromptLoader: Skipping initialization (SSR)')
        return
      }

      // Check if we already have nano-banana prompts
      const stored = localStorage.getItem('prompt-library-storage')
      if (stored) {
        try {
          const parsedData = JSON.parse(stored)
          const existingPrompts = parsedData.state?.prompts || []

          // Check if we already have nano-banana prompts by checking for specific IDs
          const hasNanoBananaPrompts = NANO_BANANA_PROMPTS.some(preset =>
            existingPrompts.some((p: SavedPrompt) => p.id === preset.id)
          )

          if (hasNanoBananaPrompts) {
            console.log('✅ NanoBananaPromptLoader: Prompts already exist, skipping load')
            this.hasInitialized = true
            return
          }
        } catch (error) {
          console.error('Error parsing stored prompt data:', error)
        }
      }

      // Load each preset prompt only once with proper deduplication
      const store = usePromptLibraryStore.getState()
      console.log(`📥 NanoBananaPromptLoader: Loading ${NANO_BANANA_PROMPTS.length} preset prompts...`)

      for (const preset of NANO_BANANA_PROMPTS) {
        try {
          await store.addPrompt({
            title: preset.title,
            prompt: preset.prompt,
            categoryId: preset.categoryId,
            tags: preset.tags,
            reference: preset.reference,
            isQuickAccess: preset.isQuickAccess || false,
            metadata: {
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            id: `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          })
        } catch (error) {
          // Silently continue - prompts will work locally even without Supabase
          console.log('Note: Prompt added locally (Supabase save may have failed)', error)
        }
      }

      this.hasInitialized = true
      console.log('✅ NanoBananaPromptLoader: Initialization completed successfully')

    } catch (error) {
      console.error('❌ NanoBananaPromptLoader: Initialization failed:', error)
      // Reset the promise so it can be retried
      this.initializationPromise = null
      throw error
    }
  }

  private async clearDuplicatePrompts(): Promise<void> {
    // Check for browser environment
    if (typeof window === 'undefined') return

    const stored = localStorage.getItem('prompt-library-storage')
    if (!stored) return

    try {
      const parsedData = JSON.parse(stored)
      const existingPrompts = parsedData.state?.prompts || []

      // Deduplicate by ID, keeping only the first occurrence
      const seenIds = new Set<string>()
      const deduplicatedPrompts = existingPrompts.filter((prompt: SavedPrompt) => {
        if (seenIds.has(prompt.id)) {
          return false // Skip duplicate
        }
        seenIds.add(prompt.id)
        return true
      })

      // Also deduplicate quick prompts - filter by the deduplicated prompts that have isQuickAccess
      const deduplicatedQuickPrompts = deduplicatedPrompts.filter((prompt: SavedPrompt) => prompt.isQuickAccess)

      const duplicatesRemoved = existingPrompts.length - deduplicatedPrompts.length

      if (duplicatesRemoved > 0) {
        console.log(`🧹 NanoBananaPromptLoader: Removed ${duplicatesRemoved} duplicate prompts`)

        // Update localStorage with deduplicated data
        parsedData.state.prompts = deduplicatedPrompts
        parsedData.state.quickPrompts = deduplicatedQuickPrompts
        localStorage.setItem('prompt-library-storage', JSON.stringify(parsedData))

        // Force store update
        usePromptLibraryStore.setState({
          prompts: deduplicatedPrompts,
          quickPrompts: deduplicatedQuickPrompts
        })
      }
    } catch (error) {
      console.error('Error clearing duplicate prompts:', error)
    }
  }
}

// Export singleton instance
const promptLoaderSingleton = PromptLoaderSingleton.getInstance()

export function NanoBananaPromptLoader() {
  useEffect(() => {
    // Initialize the singleton - this will only run once across all component instances
    promptLoaderSingleton.initialize().catch(error => {
      console.error('Failed to initialize prompt loader:', error)
    })
  }, []) // Empty dependency array - only run once on mount

  return null // This component doesn't render anything
}

// Utility function to manually clear all prompt duplicates
export async function clearAllPromptDuplicates(): Promise<void> {
  // Only run in browser environment
  if (typeof window === 'undefined') {
    return
  }

  try {
    console.log('🧹 Manually clearing all prompt duplicates...')

    // Clear from localStorage
    const stored = localStorage.getItem('prompt-library-storage')
    if (stored) {
      try {
        const parsedData = JSON.parse(stored)
        const existingPrompts = parsedData.state?.prompts || []

        // Deduplicate by ID, keeping only the first occurrence
        const seenIds = new Set<string>()
        const deduplicatedPrompts = existingPrompts.filter((prompt: SavedPrompt) => {
          if (seenIds.has(prompt.id)) {
            return false // Skip duplicate
          }
          seenIds.add(prompt.id)
          return true
        })

        // Also deduplicate quick prompts - filter by the deduplicated prompts that have isQuickAccess
        const deduplicatedQuickPrompts = deduplicatedPrompts.filter((prompt: SavedPrompt) => prompt.isQuickAccess)

        const duplicatesRemoved = existingPrompts.length - deduplicatedPrompts.length

        if (duplicatesRemoved > 0) {
          console.log(`🧹 Removed ${duplicatesRemoved} duplicate prompts from localStorage`)

          // Update localStorage with deduplicated data
          parsedData.state.prompts = deduplicatedPrompts
          parsedData.state.quickPrompts = deduplicatedQuickPrompts
          localStorage.setItem('prompt-library-storage', JSON.stringify(parsedData))

          // Force store update
          usePromptLibraryStore.setState({
            prompts: deduplicatedPrompts,
            quickPrompts: deduplicatedQuickPrompts
          })

          console.log('✅ Duplicates cleared successfully')
        } else {
          console.log('✅ No duplicates found')
        }
      } catch (error) {
        console.error('Error parsing stored prompt data:', error)
      }
    }

    // Also run the store's deduplication method
    const store = usePromptLibraryStore.getState()
    store.deduplicatePrompts()

  } catch (error) {
    console.error('❌ Error clearing prompt duplicates:', error)
    throw error
  }
}

// Utility function to reset the singleton and force re-initialization (for debugging)
export function resetPromptLoader(): void {
  console.log('🔄 Resetting prompt loader singleton...')
  // Reset the singleton instance
  PromptLoaderSingleton['instance'] = undefined
  promptLoaderSingleton['hasInitialized'] = false
  promptLoaderSingleton['initializationPromise'] = null
  console.log('✅ Prompt loader reset complete')
}