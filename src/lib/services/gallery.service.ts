/**
 * Unified Gallery Service
 * Handles CRUD operations for all gallery items (images and videos)
 */

import { getClient } from '@/lib/db/client'
import { GalleryRepository } from '@/lib/db/repositories/gallery.repository'
import type { GalleryRow } from '@/lib/db/types'

export type GenerationType = 'image' | 'video'

interface DeleteResult {
  success: boolean
  error?: string
}

export class GalleryService {
  /**
   * Load gallery items for the current user
   */
  static async loadUserGallery(
    generationType: GenerationType,
    options?: {
      includeProcessing?: boolean
    }
  ): Promise<GalleryRow[]> {
    try {
      const supabase = await getClient()
      if (!supabase) {
        throw new Error('Supabase client not available')
      }

      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.warn('User not authenticated, cannot load gallery')
        return []
      }

      const repository = new GalleryRepository(supabase)

      // Get items for the current user with specified generation_type
      const result = await repository.get({
        user_id: user.id,
        generation_type: generationType,
      })

      if (result.error) {
        console.error(`Error fetching ${generationType} gallery:`, result.error)
        return []
      }

      // Filter by public_url if not including processing items
      let items = result.data
      if (!options?.includeProcessing) {
        items = items.filter(item => item.public_url !== null)
      }

      // Sort by created_at descending
      items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      return items
    } catch (error) {
      console.error(`Failed to load ${generationType} gallery:`, error)
      return []
    }
  }

  /**
   * Delete a gallery item (database entry and storage file)
   */
  static async deleteItem(itemId: string): Promise<DeleteResult> {
    try {
      const supabase = await getClient()
      if (!supabase) {
        throw new Error('Supabase client not available')
      }

      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        throw new Error('User not authenticated')
      }

      const repository = new GalleryRepository(supabase)

      // Get the gallery entry to verify ownership and get storage path
      const getResult = await repository.get({
        id: itemId,
        user_id: user.id,
      })

      if (getResult.error || getResult.data.length === 0) {
        throw new Error('Gallery item not found or access denied')
      }

      const galleryItem = getResult.data[0]

      // Delete from storage if storage_path exists
      if (galleryItem.storage_path) {
        const { error: storageError } = await supabase.storage
          .from('directors-palette')
          .remove([galleryItem.storage_path])

        if (storageError) {
          console.error('Error deleting from storage:', storageError)
          // Continue with database deletion even if storage deletion fails
        }
      }

      // Delete from database
      const deleteResult = await repository.delete(itemId)

      if (deleteResult.error) {
        throw new Error(deleteResult.error)
      }

      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete item'
      console.error('Delete gallery item error:', error)
      return { success: false, error: errorMessage }
    }
  }

  /**
   * Get a single gallery item by ID
   */
  static async getItemById(
    itemId: string,
    generationType?: GenerationType
  ): Promise<GalleryRow | null> {
    try {
      const supabase = await getClient()
      if (!supabase) {
        throw new Error('Supabase client not available')
      }

      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        return null
      }

      const repository = new GalleryRepository(supabase)
      const filters: Record<string, unknown> = {
        id: itemId,
        user_id: user.id,
      }

      if (generationType) {
        filters.generation_type = generationType
      }

      const result = await repository.get(filters)

      if (result.error || result.data.length === 0) {
        return null
      }

      return result.data[0]
    } catch (error) {
      console.error('Failed to get gallery item by ID:', error)
      return null
    }
  }

  /**
   * Get count of pending items (no public_url yet)
   */
  static async getPendingCount(generationType: GenerationType): Promise<number> {
    try {
      const supabase = await getClient()
      if (!supabase) {
        return 0
      }

      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        return 0
      }

      const { data, error } = await supabase
        .from('gallery')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('generation_type', generationType)
        .is('public_url', null)

      if (error) {
        console.error('Error getting pending count:', error)
        return 0
      }

      return data?.length || 0
    } catch (error) {
      console.error('Failed to get pending count:', error)
      return 0
    }
  }
}
