/**
 * Gallery Service
 * Handles CRUD operations for gallery images in Supabase
 */

import { getClient } from '@/lib/db/client'
import type { GeneratedImage } from '../store/unified-gallery-store'
import { GalleryMetadata } from "@/features/generation/services/webhook.service"

export class GalleryService {
    /**
     * Load all gallery images for the current user
     */
    static async loadUserGallery(): Promise<GeneratedImage[]> {
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

            // Load gallery images for the current user where public_url is set (image is ready)
            const { data: galleryItems, error: fetchError } = await supabase
                .from('gallery')
                .select('*')
                .eq('user_id', user.id)
                .not('public_url', 'is', null)
                .order('created_at', { ascending: false })

            if (fetchError) {
                console.error('Error fetching gallery:', fetchError)
                return []
            }

            // Debug: check if there are pending images
            const { data: pendingItems } = await supabase
                .from('gallery')
                .select('id, prediction_id, created_at')
                .eq('user_id', user.id)
                .is('public_url', null)

            if (pendingItems && pendingItems.length > 0) {
                console.log(`📊 Found ${pendingItems.length} pending images (no public_url yet)`)
            }

            if (!galleryItems || galleryItems.length === 0) {
                return []
            }

            // Transform database records to GeneratedImage format
            const images: GeneratedImage[] = galleryItems.map(item => {
                const metadata = item.metadata as GalleryMetadata || {}

                return {
                    id: item.id,
                    url: item.public_url || '',
                    prompt: metadata.prompt || '',
                    source: 'shot-creator' as const,
                    model: 'nano-banana',
                    settings: {
                        aspectRatio: '16:9',
                        resolution: '1024x1024',
                    },
                    metadata: {
                        createdAt: item.created_at,
                        creditsUsed: 1,
                    },
                    createdAt: item.created_at,
                    timestamp: new Date(item.created_at).getTime(),
                    tags: [],
                    persistence: {
                        isPermanent: true,
                        temporaryUrl: metadata.replicate_url,
                        storagePath: item.storage_path,
                        fileSize: item.file_size,
                        downloadedAt: item.created_at,
                    },
                }
            })

            return images
        } catch (error) {
            console.error('Failed to load gallery:', error)
            return []
        }
    }

    /**
     * Delete a gallery image (database entry and storage file)
     */
    static async deleteImage(imageId: string): Promise<{ success: boolean; error?: string }> {
        try {
            const supabase = await getClient()
            if (!supabase) {
                throw new Error('Supabase client not available')
            }

            const { data: { user }, error: authError } = await supabase.auth.getUser()
            if (authError || !user) {
                throw new Error('User not authenticated')
            }

            // Get the gallery entry to find storage path
            const { data: galleryItem, error: fetchError } = await supabase
                .from('gallery')
                .select('*')
                .eq('id', imageId)
                .eq('user_id', user.id)
                .single()

            if (fetchError || !galleryItem) {
                throw new Error('Gallery item not found')
            }

            // Delete from storage if storage_path exists
            if (galleryItem.storage_path) {
                const { error: storageError } = await supabase.storage
                    .from('directors-palette')
                    .remove([galleryItem.storage_path])

                if (storageError) {
                    console.error('Error deleting from storage:', storageError)
                }
            }

            // Delete from database
            const { error: deleteError } = await supabase
                .from('gallery')
                .delete()
                .eq('id', imageId)
                .eq('user_id', user.id)

            if (deleteError) {
                throw deleteError
            }

            return { success: true }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to delete image'
            console.error('Delete image error:', error)
            return { success: false, error: errorMessage }
        }
    }
}
