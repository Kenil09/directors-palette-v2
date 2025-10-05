/**
 * Gallery Service for Shot Animator
 * Handles video gallery operations using the repository pattern
 */

import { getClient } from '@/lib/db/client'
import { GalleryRepository } from '@/lib/db/repositories/gallery.repository'
import type { GalleryRow } from '@/lib/db/types'
import type { GeneratedVideo } from '../types'

export class VideoGalleryService {
  /**
   * Load all video gallery items for the current user
   */
  static async loadUserVideos(): Promise<GeneratedVideo[]> {
    try {
      const supabase = await getClient()
      if (!supabase) {
        throw new Error('Supabase client not available')
      }

      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.warn('User not authenticated, cannot load video gallery')
        return []
      }

      const repository = new GalleryRepository(supabase)
      
      // Get videos for the current user with generation_type = 'video'
      const result = await repository.get({
        user_id: user.id,
        generation_type: 'video',
      })

      if (result.error) {
        console.error('Error fetching video gallery:', result.error)
        return []
      }

      // Transform database records to GeneratedVideo format
      const videos: GeneratedVideo[] = result.data
        .map((item) => this.transformToGeneratedVideo(item))
        .filter((video): video is GeneratedVideo => video !== null)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      return videos
    } catch (error) {
      console.error('Failed to load video gallery:', error)
      return []
    }
  }

  /**
   * Delete a video from the gallery
   */
  static async deleteVideo(videoId: string): Promise<{ success: boolean; error?: string }> {
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
        id: videoId,
        user_id: user.id,
      })

      if (getResult.error || getResult.data.length === 0) {
        throw new Error('Video not found or access denied')
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
      const deleteResult = await repository.delete(videoId)

      if (deleteResult.error) {
        throw new Error(deleteResult.error)
      }

      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete video'
      console.error('Delete video error:', error)
      return { success: false, error: errorMessage }
    }
  }

  /**
   * Transform database row to GeneratedVideo
   */
  private static transformToGeneratedVideo(item: GalleryRow): GeneratedVideo | null {
    try {
      const metadata = (item.metadata as Record<string, unknown>) || {}
      
      // Only return videos that have a public URL (completed)
      if (!item.public_url) {
        return null
      }

      return {
        id: item.id,
        videoUrl: item.public_url,
        thumbnailUrl: undefined, // Can be added later if thumbnails are generated
        shotName: (metadata.prompt as string) || 'Untitled Video',
        model: (metadata.model as string) || 'unknown',
        createdAt: new Date(item.created_at),
        status: item.status === 'completed' ? 'completed' : 
                item.status === 'failed' ? 'failed' : 'processing',
        progress: undefined,
      }
    } catch (error) {
      console.error('Error transforming gallery item:', error)
      return null
    }
  }

  /**
   * Get a single video by ID
   */
  static async getVideoById(videoId: string): Promise<GeneratedVideo | null> {
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
      const result = await repository.get({
        id: videoId,
        user_id: user.id,
        generation_type: 'video',
      })

      if (result.error || result.data.length === 0) {
        return null
      }

      return this.transformToGeneratedVideo(result.data[0])
    } catch (error) {
      console.error('Failed to get video by ID:', error)
      return null
    }
  }
}
