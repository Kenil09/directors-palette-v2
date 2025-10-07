/**
 * Hook to manage video gallery with real-time updates
 * Loads videos from the database and subscribes to changes
 */

import { useEffect, useState, useCallback } from 'react'
import { getClient } from '@/lib/db/client'
import { VideoGalleryService } from '../services/gallery.service'
import type { GeneratedVideo } from '../types'
import { GalleryRow } from '@/lib/db/types'

interface UseGalleryReturn {
  videos: GeneratedVideo[]
  galleryImages: GalleryRow[]
  isLoading: boolean
  error: string | null
  deleteVideo: (videoId: string) => Promise<boolean>
  refreshVideos: () => Promise<void>
  // Pagination support
  currentPage: number
  totalPages: number
  totalCount: number
  loadPage: (page: number) => Promise<void>
  pageSize: number
}

export function useGallery(enablePagination = false, itemsPerPage = 12): UseGalleryReturn {
  const [videos, setVideos] = useState<GeneratedVideo[]>([])
  const [galleryImages, setGalleryImages] = useState<GalleryRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const pageSize = itemsPerPage

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
   * Load images from the database
   */
  const loadImages = useCallback(async (page = 1) => {
    try {
      if (enablePagination) {
        const result = await VideoGalleryService.loadUserImagesPaginated(page, pageSize)
        setGalleryImages(result.items)
        setTotalPages(result.totalPages)
        setTotalCount(result.total)
        setCurrentPage(page)
      } else {
        const loadedImages = await VideoGalleryService.loadUserImages()
        setGalleryImages(loadedImages)
        setTotalCount(loadedImages.length)
        setTotalPages(1)
      }
      setError(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load images'
      setError(errorMessage)
      console.error('Image gallery loading error:', err)
    }
  }, [enablePagination, pageSize])

  /**
   * Load a specific page of images
   */
  const loadPage = useCallback(async (page: number) => {
    if (!enablePagination) return

    setIsLoading(true)
    await loadImages(page)
    setIsLoading(false)
  }, [enablePagination, loadImages])

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
              .channel(`video-gallery-${user.id}`)
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

  useEffect(() => {
    loadImages()
  }, [loadImages])

  return {
    videos,
    galleryImages,
    isLoading,
    error,
    deleteVideo,
    refreshVideos,
    currentPage,
    totalPages,
    totalCount,
    loadPage,
    pageSize,
  }
}
