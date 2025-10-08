'use client'

import { useState, useCallback, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { imageGenerationService } from '../services/image-generation.service'
import { useShotCreatorStore } from '../store/shot-creator.store'
import { getClient, TypedSupabaseClient } from '@/lib/db/client'
import { parseDynamicPrompt } from '../helpers/prompt-syntax-feedback'
import { ImageGenerationRequest, ImageModel, ImageModelSettings } from "../types/image-generation.types"
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface GenerationProgress {
    status: 'idle' | 'starting' | 'processing' | 'waiting' | 'succeeded' | 'failed'
    predictionId?: string
    galleryId?: string
    error?: string
}

/**
 * Wait for an image to be completed in the gallery (for pipe chaining)
 * @param supabase Supabase client
 * @param galleryId Gallery ID to wait for
 * @param maxWaitTime Maximum time to wait in milliseconds (default: 2 minutes)
 * @returns The public URL of the completed image, or throws error with details
 */
async function waitForImageCompletion(
    supabase: TypedSupabaseClient,
    galleryId: string,
    maxWaitTime: number = 120000 // 2 minutes
): Promise<string> {
    return new Promise((resolve, reject) => {
        let timeoutId: NodeJS.Timeout | null = null
        let subscription: RealtimeChannel | null = null
        let pollInterval: NodeJS.Timeout | null = null

        const cleanup = () => {
            if (timeoutId) clearTimeout(timeoutId)
            if (pollInterval) clearInterval(pollInterval)
            if (subscription) subscription.unsubscribe()
        }

        // Set timeout
        timeoutId = setTimeout(async () => {
            cleanup()

            // Check final status before timing out
            const { data: finalCheck } = await supabase
                .from('gallery')
                .select('status, public_url, error_message, metadata')
                .eq('id', galleryId)
                .single()

            const status = finalCheck?.status || 'unknown'
            const errorMsg = finalCheck?.error_message || (finalCheck?.metadata as { error?: string })?.error

            reject(new Error(
                `Timeout after ${maxWaitTime / 1000}s. Status: ${status}. ` +
                (errorMsg ? `Error: ${errorMsg}` : 'No public URL received from webhook.')
            ))
        }, maxWaitTime)

        // Poll every 2 seconds as backup to realtime subscription
        const checkStatus = async () => {
            try {
                const { data, error } = await supabase
                    .from('gallery')
                    .select('public_url, status, error_message, metadata')
                    .eq('id', galleryId)
                    .single()

                if (error) {
                    // Check if it's a network error (contains "Failed to fetch" or similar)
                    const isNetworkError = error.message?.toLowerCase().includes('failed to fetch') ||
                        error.message?.toLowerCase().includes('network') ||
                        error.code === ''

                    if (isNetworkError) {
                        // Log but don't fail - realtime subscription will continue
                        console.warn('Network error in polling (will retry):', error.message)
                        return
                    }

                    console.error('Error checking gallery status:', error)
                    return
                }

                // Check for successful completion
                if (data.public_url) {
                    cleanup()
                    resolve(data.public_url)
                    return
                }

                // Check for failure
                if (data.status === 'failed') {
                    cleanup()
                    const errorMsg = data.error_message || (data.metadata as { error?: string })?.error || 'Generation failed'
                    reject(new Error(`Generation failed: ${errorMsg}`))
                    return
                }

                // Check for cancellation
                if (data.status === 'canceled') {
                    cleanup()
                    reject(new Error('Generation was canceled'))
                    return
                }
            } catch (err) {
                console.error('Error in polling:', err)
            }
        }

        // Start polling immediately and every 2 seconds
        checkStatus()
        pollInterval = setInterval(checkStatus, 2000)

        // Subscribe to gallery updates for real-time notifications
        subscription = supabase
            .channel(`wait-gallery-${galleryId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'gallery',
                    filter: `id=eq.${galleryId}`
                },
                (payload) => {
                    const updatedRecord = payload.new as {
                        public_url?: string
                        status?: string
                        error_message?: string
                        metadata?: { error?: string }
                    }

                    // Check if image is ready
                    if (updatedRecord.public_url) {
                        cleanup()
                        resolve(updatedRecord.public_url)
                    } else if (updatedRecord.status === 'failed') {
                        cleanup()
                        const errorMsg = updatedRecord.error_message || updatedRecord.metadata?.error || 'Generation failed'
                        reject(new Error(`Generation failed: ${errorMsg}`))
                    } else if (updatedRecord.status === 'canceled') {
                        cleanup()
                        reject(new Error('Generation was canceled'))
                    }
                }
            )
            .subscribe()
    })
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

                            // Reset prompt only (keep reference images for reuse)
                            const { setShotCreatorPrompt } = useShotCreatorStore.getState()
                            setShotCreatorPrompt('')

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
            if (authError) {
                console.error('Authentication error:', authError)
                throw new Error(`Authentication failed: ${authError.message}`)
            }
            if (!user) {
                throw new Error('User not authenticated. Please log in.')
            }

            // Expand bracket variations using existing prompt parser
            const promptResult = parseDynamicPrompt(prompt)
            const variations = promptResult.expandedPrompts
            const totalVariations = promptResult.totalCount
            const isPipeChaining = promptResult.hasPipes

            // Set processing state
            setShotCreatorProcessing(true)
            setProgress({ status: 'starting' })

            toast({
                title: 'Starting Generation',
                description: isPipeChaining
                    ? `Chaining ${totalVariations} sequential steps...`
                    : totalVariations > 1
                    ? `Generating ${totalVariations} variations...`
                    : 'Your image is being created...',
            })

            const results = []
            let previousImageUrl: string | undefined = undefined

            // Generate all variations
            for (let i = 0; i < variations.length; i++) {
                const variationPrompt = variations[i]
                const isFirstStep = i === 0
                const isLastStep = i === variations.length - 1
                const inputImages = isPipeChaining
                    ? (isFirstStep ? (referenceImages.length > 0 ? referenceImages : undefined) : previousImageUrl ? [previousImageUrl] : undefined)
                    : (referenceImages.length > 0 ? referenceImages : undefined)

                // Update model settings for img2img if we have an input image from previous step
                let currentModelSettings: ImageModelSettings = { ...modelSettings }
                if (isPipeChaining && previousImageUrl && !isFirstStep) {
                    if (model === 'qwen-image') {
                        currentModelSettings = {
                            ...currentModelSettings,
                            image: previousImageUrl,
                            // Set strength for img2img transformation (adjustable)
                            strength: (currentModelSettings as { strength?: number }).strength ?? 0.75
                        }
                    } else if (model === 'qwen-image-edit') {
                        currentModelSettings = {
                            ...currentModelSettings,
                            image: previousImageUrl
                        }
                    }
                }
                const request: ImageGenerationRequest = {
                    model,
                    prompt: variationPrompt,
                    referenceImages: inputImages,
                    modelSettings: currentModelSettings,
                    user_id: user.id,
                }
                toast({
                    title: isPipeChaining ? `Step ${i + 1}/${totalVariations}` : 'Generating',
                    description: variationPrompt.slice(0, 60) + (variationPrompt.length > 60 ? '...' : ''),
                })
                const response = await imageGenerationService.generateImage(request)
                results.push(response)
                // For pipe chaining, wait for the image to complete before proceeding to next step for pipe previous result
                if (isPipeChaining) {
                    toast({
                        title: `Waiting for Step ${i + 1}/${totalVariations}`,
                        description: 'Processing image...',
                    })
                    // Wait for the image URL from webhook/Supabase
                    try {
                        const imageUrl = await waitForImageCompletion(supabase, response.galleryId)
                        previousImageUrl = imageUrl
                        toast({
                            title: `Step ${i + 1}/${totalVariations} Complete`,
                            description: isLastStep ? 'All images saved to gallery!' : 'Moving to next step...',
                        })
                    } catch (waitError) {
                        const errorMsg = waitError instanceof Error ? waitError.message : 'Unknown error'
                        console.error(`Step ${i + 1} failed:`, errorMsg)
                        throw new Error(`Step ${i + 1} failed: ${errorMsg}`)
                    }
                }
                if (isLastStep) {
                    setActiveGalleryId(response.galleryId)
                }
            }

            // Mark as waiting and stop the loader after API calls succeed
            setProgress({
                status: isPipeChaining ? 'succeeded' : 'waiting',
                predictionId: results[results.length - 1].predictionId,
                galleryId: results[results.length - 1].galleryId,
            })
            setShotCreatorProcessing(false)

            // Reset prompt after successful generation
            const { setShotCreatorPrompt } = useShotCreatorStore.getState()
            setShotCreatorPrompt('')

            toast({
                title: isPipeChaining ? 'Chain Complete!' : 'Generation Started!',
                description: isPipeChaining
                    ? `All ${totalVariations} images saved to gallery!`
                    : totalVariations > 1
                    ? `${totalVariations} images will appear in the gallery when ready.`
                    : 'Your image will appear in the gallery when ready.',
            })

            return {
                success: true,
                predictionId: results[results.length - 1].predictionId,
                galleryId: results[results.length - 1].galleryId,
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
