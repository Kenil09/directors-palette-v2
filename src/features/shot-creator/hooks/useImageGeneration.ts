'use client'

import { useState, useCallback, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { imageGenerationService } from '../services/image-generation.service'
import { useShotCreatorStore } from '../store/shot-creator.store'
import { getClient } from '@/lib/db/client'
import { parseDynamicPrompt } from '../helpers/prompt-syntax-feedback'
import { ImageGenerationRequest, ImageModel, ImageModelSettings } from "../types/image-generation.types"

export interface GenerationProgress {
    status: 'idle' | 'starting' | 'processing' | 'waiting' | 'succeeded' | 'failed'
    predictionId?: string
    galleryId?: string
    error?: string
}

export function useImageGeneration() {
    const { toast } = useToast()
    const [progress, setProgress] = useState<GenerationProgress>({ status: 'idle' })
    const { setShotCreatorProcessing } = useShotCreatorStore()
    const [activeGalleryId, setActiveGalleryId] = useState<string | null>(null)

    // Subscribe to real-time updates for the active gallery entry
    useEffect(() => {
        if (!activeGalleryId) return

        let subscription: { unsubscribe: () => void } | null = null
        let timeoutId: NodeJS.Timeout | null = null

        const setupSubscription = async () => {
            const supabase = await getClient()
            if (!supabase) {
                console.warn('Supabase client not available for subscription')
                return
            }           
            subscription = supabase
                .channel(`gallery-item-${activeGalleryId}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'gallery',
                        filter: `id=eq.${activeGalleryId}`
                    },
                    (payload) => {
                        const updatedRecord = payload.new

                        // Check if the image has been processed by webhook
                        if (updatedRecord.public_url) {
                            if (timeoutId) clearTimeout(timeoutId)
                            setProgress({ status: 'succeeded' })
                            setShotCreatorProcessing(false)
                            setActiveGalleryId(null)

                            // Reset prompt and reference images
                            const { setShotCreatorPrompt, setShotCreatorReferenceImages } = useShotCreatorStore.getState()
                            setShotCreatorPrompt('')
                            setShotCreatorReferenceImages([])

                            toast({
                                title: 'Image Ready!',
                                description: 'Your image has been saved to the gallery.',
                            })
                        } else if (updatedRecord.metadata?.error) {                            
                            if (timeoutId) clearTimeout(timeoutId)
                            setProgress({
                                status: 'failed',
                                error: updatedRecord.metadata.error
                            })
                            setShotCreatorProcessing(false)
                            setActiveGalleryId(null)

                            toast({
                                title: 'Generation Failed',
                                description: updatedRecord.metadata.error,
                                variant: 'destructive',
                            })
                        }
                    }
                )
                .subscribe()

            // Set timeout fallback (1 minute)
            timeoutId = setTimeout(() => {
                setProgress({ status: 'succeeded' })
                setShotCreatorProcessing(false)
                setActiveGalleryId(null)

                toast({
                    title: 'Processing...',
                    description: 'Your image is still being generated. Check the gallery in a few moments.',
                })
            }, 60000) // 1 minute
        }

        setupSubscription()

        return () => {
            if (subscription) {
                subscription.unsubscribe()
            }
            if (timeoutId) {
                clearTimeout(timeoutId)
            }
        }
    }, [activeGalleryId, setShotCreatorProcessing, toast])

    const generateImage = useCallback(async (
        model: ImageModel,
        prompt: string,
        referenceImages: string[] = [],
        modelSettings: ImageModelSettings
    ) => {
        try {
            // Get user ID from Supabase
            const supabase = await getClient()
            if (!supabase) {
                throw new Error('Supabase client not available')
            }

            const { data: { user }, error: authError } = await supabase.auth.getUser()
            if (authError || !user) {
                throw new Error('User not authenticated')
            }

            // Expand bracket variations using existing prompt parser
            const promptResult = parseDynamicPrompt(prompt)
            const variations = promptResult.expandedPrompts
            const totalVariations = promptResult.totalCount

            // Set processing state
            setShotCreatorProcessing(true)
            setProgress({ status: 'starting' })

            toast({
                title: 'Starting Generation',
                description: totalVariations > 1
                    ? `Generating ${totalVariations} variations...`
                    : 'Your image is being created...',
            })

            // Generate all variations
            const results = []
            for (const variationPrompt of variations) {
                const request: ImageGenerationRequest = {
                    model,
                    prompt: variationPrompt,
                    referenceImages: referenceImages.length > 0 ? referenceImages : undefined,
                    modelSettings,
                    user_id: user.id,
                }

                const response = await imageGenerationService.generateImage(request)
                results.push(response)

                // Set active gallery ID for the last variation to listen for updates
                if (variationPrompt === variations[variations.length - 1]) {
                    setActiveGalleryId(response.galleryId)
                }
            }

            // Mark as waiting and stop the loader after API calls succeed
            setProgress({
                status: 'waiting',
                predictionId: results[0].predictionId,
                galleryId: results[0].galleryId,
            })
            setShotCreatorProcessing(false)

            // Clear reference images immediately after successful API call
            const { setShotCreatorReferenceImages } = useShotCreatorStore.getState()
            setShotCreatorReferenceImages([])

            toast({
                title: 'Generation Started!',
                description: totalVariations > 1
                    ? `${totalVariations} images will appear in the gallery when ready.`
                    : 'Your image will appear in the gallery when ready.',
            })

            return {
                success: true,
                predictionId: results[0].predictionId,
                galleryId: results[0].galleryId,
                totalVariations,
            }
        } catch (error) {
            console.error('Image generation failed:', error)
            const errorMessage = error instanceof Error ? error.message : 'Failed to generate image'

            setProgress({ status: 'failed', error: errorMessage })
            setShotCreatorProcessing(false)
            setActiveGalleryId(null)

            toast({
                title: 'Generation Failed',
                description: errorMessage,
                variant: 'destructive',
            })

            return {
                success: false,
                error: errorMessage,
            }
        }
    }, [toast, setShotCreatorProcessing])

    const resetProgress = useCallback(() => {
        setProgress({ status: 'idle' })
        setActiveGalleryId(null)
    }, [])

    return {
        generateImage,
        resetProgress,
        isGenerating: progress.status === 'starting' || progress.status === 'processing',
    }
}
