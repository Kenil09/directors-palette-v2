/**
 * Hook to manage video gallery with real-time updates
 * Loads videos from the database and subscribes to changes
 */

import { useEffect, useState, useCallback } from 'react'
import { getClient } from '@/lib/db/client'
import { VideoGalleryService } from '../services/gallery.service'
import type { GeneratedVideo } from '../types'

interface UseGalleryReturn {
  videos: GeneratedVideo[]
  isLoading: boolean
  error: string | null
  deleteVideo: (videoId: string) => Promise<boolean>
  refreshVideos: () => Promise<void>
}

export function useGallery(): UseGalleryReturn {
  const [videos, setVideos] = useState<GeneratedVideo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Load videos from the database
   */
  const loadVideos = useCallback(async () => {
    try {
      const loadedVideos = await VideoGalleryService.loadUserVideos()
      setVideos(loadedVideos)
      setError(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load videos'
      setError(errorMessage)
      console.error('Video gallery loading error:', err)
    }
  }, [])

  /**
   * Delete a video from the gallery
   */
  const deleteVideo = useCallback(async (videoId: string): Promise<boolean> => {
    try {
      const result = await VideoGalleryService.deleteVideo(videoId)
      
      if (result.success) {
        // Optimistically update the UI
        setVideos((prev) => prev.filter((video) => video.id !== videoId))
        return true
      } else {
        setError(result.error || 'Failed to delete video')
        return false
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete video'
      setError(errorMessage)
      console.error('Delete video error:', err)
      return false
    }
  }, [])

  /**
   * Manually refresh videos
   */
  const refreshVideos = useCallback(async () => {
    setIsLoading(true)
    await loadVideos()
    setIsLoading(false)
  }, [loadVideos])

  // Load videos on mount and set up real-time subscription
  useEffect(() => {
    let mounted = true
    let subscription: { unsubscribe: () => void } | null = null

    const initializeGallery = async () => {
      if (!mounted) return

      setIsLoading(true)
      setError(null)

      try {
        // Initial load
        await loadVideos()

        // Set up real-time subscription to gallery changes
        const supabase = await getClient()
        if (supabase) {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            subscription = supabase
              .channel('video-gallery-changes')
              .on(
                'postgres_changes',
                {
                  event: '*',
                  schema: 'public',
                  table: 'gallery',
                  filter: `user_id=eq.${user.id}`,
                },
                async (payload) => {
                  console.log('Gallery change detected:', payload)
                  
                  // Reload videos when changes occur
                  if (mounted) {
                    await loadVideos()
                  }
                }
              )
              .subscribe()
          }
        }
      } catch (err) {
        if (!mounted) return

        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize gallery'
        setError(errorMessage)
        console.error('Gallery initialization error:', err)
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    initializeGallery()

    return () => {
      mounted = false
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [loadVideos])

  return {
    videos,
    isLoading,
    error,
    deleteVideo,
    refreshVideos,
  }
}
