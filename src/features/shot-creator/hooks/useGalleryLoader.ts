/**
 * Hook to load gallery images from Supabase with real-time updates
 */

import { useEffect, useState } from 'react'
import { GalleryService } from '../services/gallery.service'
import { useUnifiedGalleryStore } from '../store/unified-gallery-store'
import { getClient } from '@/lib/db/client'

export function useGalleryLoader() {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const { loadImagesPaginated, currentPage, pageSize } = useUnifiedGalleryStore()

    // Load gallery on mount and subscribe to real-time updates
    useEffect(() => {
        let mounted = true
        let subscription: { unsubscribe: () => void } | null = null

        const loadGallery = async () => {
            if (!mounted) return

            setIsLoading(true)
            setError(null)

            try {
                const { images, total, totalPages } = await GalleryService.loadUserGalleryPaginated(
                    currentPage,
                    pageSize
                )

                if (!mounted) return

                loadImagesPaginated(images, total, totalPages)

                // Set up real-time subscription to gallery changes
                const supabase = await getClient()
                if (supabase) {
                    const { data: { user } } = await supabase.auth.getUser()
                    if (user) {
                        subscription = supabase
                            .channel('gallery-changes')
                            .on(
                                'postgres_changes',
                                {
                                    event: '*',
                                    schema: 'public',
                                    table: 'gallery',
                                    filter: `user_id=eq.${user.id}`
                                },
                                async () => {
                                    // Reload gallery when changes occur
                                    const { images: updatedImages, total: updatedTotal, totalPages: updatedTotalPages } =
                                        await GalleryService.loadUserGalleryPaginated(currentPage, pageSize)
                                    loadImagesPaginated(updatedImages, updatedTotal, updatedTotalPages)
                                }
                            )
                            .subscribe()
                    }
                }
            } catch (err) {
                if (!mounted) return

                const errorMessage = err instanceof Error ? err.message : 'Failed to load gallery'
                setError(errorMessage)
                console.error('Gallery loading error:', err)
            } finally {
                if (mounted) {
                    setIsLoading(false)
                }
            }
        }

        loadGallery()

        return () => {
            mounted = false
            if (subscription) {
                subscription.unsubscribe()
            }
        }
    }, [loadImagesPaginated, currentPage, pageSize])

    return {
        isLoading,
        error,
    }
}
