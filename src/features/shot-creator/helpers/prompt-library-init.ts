// Prompt Library Initialization Module
// This module ensures the NanoBananaPromptLoader singleton is initialized
// once per application lifecycle, not per component render.

import { clearAllPromptDuplicates } from "@/features/shot-creator/components/creator-prompt-settings/NanoBananaPromptLoader"


// Module-level initialization flag
let moduleInitialized = false

// Function to initialize prompt library at module level
async function initializePromptLibrary(): Promise<void> {
  // Only run in browser environment
  if (typeof window === 'undefined') {
    return
  }

  if (moduleInitialized) {
    return
  }

  console.log('🚀 Initializing Prompt Library at module level...')

  try {
    // Clear any existing duplicates immediately
    await clearAllPromptDuplicates()

    // Mark as initialized
    moduleInitialized = true
    console.log('✅ Prompt Library module initialization completed')

  } catch (error) {
    console.error('❌ Prompt Library module initialization failed:', error)
    // Reset flag so it can be retried
    moduleInitialized = false
  }
}

// Auto-initialize when this module is imported (only in browser)
if (typeof window !== 'undefined') {
  initializePromptLibrary().catch(console.error)
}

// Export function for manual re-initialization if needed
export function reinitializePromptLibrary(): Promise<void> {
  moduleInitialized = false
  return initializePromptLibrary()
}

// Export status check
export function isPromptLibraryInitialized(): boolean {
  return moduleInitialized
}