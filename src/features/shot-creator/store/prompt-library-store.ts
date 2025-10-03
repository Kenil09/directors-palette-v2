import { getClient } from "@/lib/db/client"
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface PromptCategory {
  id: string
  name: string
  icon: string
  color: string
  order: number
  isEditable: boolean
}

export interface SavedPrompt {
  id: string
  userId: string
  prompt: string
  title: string
  categoryId: string
  tags: string[]
  isQuickAccess: boolean
  reference?: string // @reference tag for easy access
  usage: {
    count: number
    lastUsed: string
  }
  metadata: {
    model?: string
    source?: string
    createdAt: string
    updatedAt: string
  }
}

interface PromptLibraryState {
  // Data
  prompts: SavedPrompt[]
  categories: PromptCategory[]
  quickPrompts: SavedPrompt[]
  searchQuery: string
  selectedCategory: string | null
  selectedPrompt: SavedPrompt | null
  isLoading: boolean
  error: string | null

  // Actions - Categories
  addCategory: (category: Omit<PromptCategory, 'id'>) => Promise<void>
  updateCategory: (id: string, updates: Partial<PromptCategory>) => Promise<void>
  deleteCategory: (id: string) => Promise<void>

  // Actions - Prompts
  addPrompt: (prompt: Omit<SavedPrompt, 'userId' | 'usage'> & { id?: string; metadata?: Partial<SavedPrompt['metadata']> }) => Promise<void>
  updatePrompt: (id: string, updates: Partial<SavedPrompt>) => Promise<void>
  deletePrompt: (id: string) => Promise<void>
  toggleQuickAccess: (id: string) => Promise<void>

  // Actions - Search & Filter
  setSearchQuery: (query: string) => void
  setSelectedCategory: (categoryId: string | null) => void
  setSelectedPrompt: (prompt: SavedPrompt | null) => void

  // Actions - Data Management
  loadUserPrompts: (userId: string) => Promise<void>
  saveToSupabase: (userId: string) => Promise<void>
  clearAllPrompts: () => void
  deduplicatePrompts: () => void

  // Computed
  getFilteredPrompts: () => SavedPrompt[]
  getPromptsByCategory: (categoryId: string) => SavedPrompt[]
  getPromptByReference: (reference: string) => SavedPrompt | undefined
  getAllReferences: () => string[]
}

// Default categories - matching nano-banana prompts
export const DEFAULT_CATEGORIES: PromptCategory[] = [
  { id: 'cinematic', name: 'Cinematic Shots', icon: '🎬', color: 'blue', order: 1, isEditable: false },
  { id: 'characters', name: 'Character Styles', icon: '👤', color: 'purple', order: 2, isEditable: false },
  { id: 'lighting', name: 'Lighting Setups', icon: '💡', color: 'yellow', order: 3, isEditable: false },
  { id: 'environments', name: 'Environments', icon: '🏞️', color: 'green', order: 4, isEditable: false },
  { id: 'effects', name: 'Special Effects', icon: '✨', color: 'orange', order: 5, isEditable: false },
  { id: 'moods', name: 'Moods & Atmosphere', icon: '🎭', color: 'indigo', order: 6, isEditable: false },
  { id: 'camera', name: 'Camera Angles', icon: '📷', color: 'pink', order: 7, isEditable: false },
  { id: 'styles', name: 'Art Styles', icon: '🎨', color: 'purple', order: 8, isEditable: false },
  { id: 'custom', name: 'Custom', icon: '📁', color: 'gray', order: 99, isEditable: false }
]

export const usePromptLibraryStore = create<PromptLibraryState>()(
  persist(
    (set, get) => ({
      prompts: [],
      categories: DEFAULT_CATEGORIES,
      quickPrompts: [],
      searchQuery: '',
      selectedCategory: null,
      selectedPrompt: null,
      isLoading: false,
      error: null,

      // Categories
      addCategory: async (category) => {
        const newCategory: PromptCategory = {
          ...category,
          id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          isEditable: true
        }

        set(state => ({
          categories: [...state.categories, newCategory]
        }))

        await get().saveToSupabase(await getCurrentUserId())
      },

      updateCategory: async (id, updates) => {
        set(state => ({
          categories: state.categories.map(cat =>
            cat.id === id && cat.isEditable ? { ...cat, ...updates } : cat
          )
        }))

        await get().saveToSupabase(await getCurrentUserId())
      },

      deleteCategory: async (id) => {
        const category = get().categories.find(c => c.id === id)
        if (!category?.isEditable) return

        // Move prompts to 'custom' category
        set(state => ({
          categories: state.categories.filter(cat => cat.id !== id),
          prompts: state.prompts.map(prompt =>
            prompt.categoryId === id ? { ...prompt, categoryId: 'custom' } : prompt
          )
        }))

        await get().saveToSupabase(await getCurrentUserId())
      },

      // Prompts
      addPrompt: async (promptData) => {
        const userId = await getCurrentUserId() || 'guest'
        const state = get()

        // Check if prompt already exists by title+categoryId combination
        const existingPrompt = state.prompts.find(p =>
          (p.title === promptData.title && p.categoryId === promptData.categoryId)
        )

        if (existingPrompt) {
          console.log(`Prompt already exists: ${promptData.title} (generating new ID)`)
          return // Skip adding duplicate
        }

        const newPrompt: SavedPrompt = {
          ...promptData,
          id: `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId,
          reference: promptData.reference || `@prompt_${Date.now()}`,
          usage: {
            count: 0,
            lastUsed: new Date().toISOString()
          },
          metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        }

        set(state => {
          const updatedPrompts = [...state.prompts, newPrompt]
          const quickPrompts = newPrompt.isQuickAccess
            ? [...state.quickPrompts, newPrompt]
            : state.quickPrompts

          return {
            prompts: updatedPrompts,
            quickPrompts
          }
        })

        if (userId !== 'guest') {
          await get().saveToSupabase(userId)
        }
      },

      updatePrompt: async (id, updates) => {
        set(state => {
          const updatedPrompts = state.prompts.map(prompt =>
            prompt.id === id
              ? {
                ...prompt,
                ...updates,
                metadata: {
                  ...prompt.metadata,
                  updatedAt: new Date().toISOString()
                }
              }
              : prompt
          )

          const quickPrompts = updatedPrompts.filter(p => p.isQuickAccess)

          return {
            prompts: updatedPrompts,
            quickPrompts
          }
        })

        await get().saveToSupabase(await getCurrentUserId())
      },

      deletePrompt: async (id) => {
        set(state => ({
          prompts: state.prompts.filter(prompt => prompt.id !== id),
          quickPrompts: state.quickPrompts.filter(prompt => prompt.id !== id)
        }))

        await get().saveToSupabase(await getCurrentUserId())
      },

      toggleQuickAccess: async (id) => {
        set(state => {
          const updatedPrompts = state.prompts.map(prompt =>
            prompt.id === id
              ? { ...prompt, isQuickAccess: !prompt.isQuickAccess }
              : prompt
          )

          const quickPrompts = updatedPrompts.filter(p => p.isQuickAccess)

          return {
            prompts: updatedPrompts,
            quickPrompts
          }
        })

        await get().saveToSupabase(await getCurrentUserId())
      },

      // Search & Filter
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSelectedCategory: (categoryId) => set({ selectedCategory: categoryId }),
      setSelectedPrompt: (prompt) => set({ selectedPrompt: prompt }),

      // Data Management
      loadUserPrompts: async (userId) => {
        set({ isLoading: true, error: null })
        const supabase = await getClient()
        try {
          // If no Supabase or no userId, work in offline mode
          if (!supabase || !userId || userId === 'guest') {
            console.log('Working in offline mode - no Supabase connection or guest user')
            set({ isLoading: false })
            return
          }

          // Load prompts from Supabase
          const { data: promptsData, error: promptsError } = await supabase
            .from('user_prompts')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

          if (promptsError) {
            console.warn('Failed to load prompts from Supabase:', promptsError.message)
            // Don't throw, just work offline
            set({ isLoading: false })
            return
          }

          // Load custom categories
          const { data: categoriesData, error: categoriesError } = await supabase
            .from('user_prompt_categories')
            .select('*')
            .eq('user_id', userId)
            .order('order', { ascending: true })

          if (categoriesError) {
            console.warn('Failed to load categories from Supabase:', categoriesError.message)
            // Continue with just the prompts data
          }

          const prompts = promptsData || []
          const quickPrompts = prompts.filter(p => p.is_quick_access)
          const customCategories = categoriesData || []

          set({
            prompts: prompts.map(p => ({
              id: p.id,
              userId: p.user_id,
              prompt: p.prompt,
              title: p.title,
              categoryId: p.category_id,
              tags: p.tags || [],
              isQuickAccess: p.is_quick_access,
              reference: p.reference,
              usage: {
                count: p.usage_count || 0,
                lastUsed: p.last_used || p.created_at
              },
              metadata: {
                model: p.model,
                source: p.source,
                createdAt: p.created_at,
                updatedAt: p.updated_at
              }
            })),
            quickPrompts: quickPrompts.map(p => ({
              id: p.id,
              userId: p.user_id,
              prompt: p.prompt,
              title: p.title,
              categoryId: p.category_id,
              tags: p.tags || [],
              isQuickAccess: p.is_quick_access,
              reference: p.reference,
              usage: {
                count: p.usage_count || 0,
                lastUsed: p.last_used || p.created_at
              },
              metadata: {
                model: p.model,
                source: p.source,
                createdAt: p.created_at,
                updatedAt: p.updated_at
              }
            })),
            categories: [
              ...DEFAULT_CATEGORIES,
              ...customCategories.map(c => ({
                id: c.id,
                name: c.name,
                icon: c.icon,
                color: c.color,
                order: c.order,
                isEditable: true
              }))
            ],
            isLoading: false
          })
        } catch (error) {
          console.warn('Prompt Library: Working in offline mode due to:', error instanceof Error ? error.message : error)
          // Don't set error state, just work offline
          set({ isLoading: false })
        }
      },

      saveToSupabase: async (userId) => {
        const supabase = await getClient()
        // Skip saving if no Supabase or guest user
        if (!supabase || !userId || userId === 'guest') {
          console.log('Skipping Supabase save - offline mode or guest user')
          return
        }
        try {
          const state = get()

          // Save prompts
          const promptsToSave = state.prompts.map(p => ({
            id: p.id,
            user_id: userId,
            prompt: p.prompt,
            title: p.title,
            category_id: p.categoryId,
            tags: p.tags,
            is_quick_access: p.isQuickAccess,
            reference: p.reference,
            usage_count: p.usage.count,
            last_used: p.usage.lastUsed,
            model: p.metadata.model,
            source: p.metadata.source,
            created_at: p.metadata.createdAt,
            updated_at: p.metadata.updatedAt
          }))

          const { error: promptsError } = await supabase
            .from('user_prompts')
            .upsert(promptsToSave, { onConflict: 'id' })

          if (promptsError) throw promptsError

          // Save custom categories
          const customCategories = state.categories.filter(c => c.isEditable)
          if (customCategories.length > 0) {
            const categoriesToSave = customCategories.map(c => ({
              id: c.id,
              user_id: userId,
              name: c.name,
              icon: c.icon,
              color: c.color,
              order: c.order
            }))

            const { error: categoriesError } = await supabase
              .from('user_prompt_categories')
              .upsert(categoriesToSave, { onConflict: 'id' })

            if (categoriesError) throw categoriesError
          }
        } catch (error) {
          console.warn('Failed to save to Supabase (will retry later):', error instanceof Error ? error.message : error)
          // Don't throw - just log and continue
        }
      },

      clearAllPrompts: () => {
        set({
          prompts: [],
          quickPrompts: [],
          searchQuery: '',
          selectedCategory: null,
          selectedPrompt: null
        })

        // Clear localStorage
        localStorage.removeItem('prompt-library-storage')
        console.log('All prompts cleared from storage')
      },

      deduplicatePrompts: () => {
        set(state => {
          // Deduplicate by ID, keeping only the first occurrence
          const seenIds = new Set<string>()
          const deduplicatedPrompts = state.prompts.filter(prompt => {
            if (seenIds.has(prompt.id)) {
              return false // Skip duplicate
            }
            seenIds.add(prompt.id)
            return true
          })

          // Regenerate quick prompts from deduplicated prompts
          const quickPrompts = deduplicatedPrompts.filter(p => p.isQuickAccess)

          console.log(`Deduplication: ${state.prompts.length} -> ${deduplicatedPrompts.length} prompts`)

          return {
            prompts: deduplicatedPrompts,
            quickPrompts
          }
        })
      },

      // Computed
      getFilteredPrompts: () => {
        const state = get()
        let filtered = state.prompts

        // Filter by category
        if (state.selectedCategory) {
          filtered = filtered.filter(p => p.categoryId === state.selectedCategory)
        }

        // Filter by search query
        if (state.searchQuery) {
          const query = state.searchQuery.toLowerCase()
          filtered = filtered.filter(p =>
            p.title.toLowerCase().includes(query) ||
            p.prompt.toLowerCase().includes(query) ||
            p.tags.some(tag => tag.toLowerCase().includes(query)) ||
            p.reference?.toLowerCase().includes(query)
          )
        }

        return filtered
      },

      getPromptsByCategory: (categoryId) => {
        return get().prompts.filter(p => p.categoryId === categoryId)
      },

      getPromptByReference: (reference) => {
        return get().prompts.find(p => p.reference === reference)
      },

      getAllReferences: () => {
        return get().prompts
          .map(p => p.reference)
          .filter((ref): ref is string => ref !== undefined)
      }
    }),
    {
      name: 'prompt-library-storage',
      partialize: (state) => ({
        prompts: state.prompts,
        categories: state.categories,
        quickPrompts: state.quickPrompts
      })
    }
  )
)

// Helper to get current user ID
async function getCurrentUserId(): Promise<string> {
  const supabase = await getClient()
  if (!supabase) return ''
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id || ''
}