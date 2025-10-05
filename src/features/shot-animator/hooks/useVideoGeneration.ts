'use client'

import { useState } from 'react'
import { toast } from '@/hooks/use-toast'
import type {
  AnimationModel,
  ShotAnimationConfig,
  ModelSettings,
  VideoGenerationRequest,
  VideoGenerationResponse,
  VideoGenerationError,
} from '../types'

interface GenerationResult {
  shotId: string
  success: boolean
  galleryId?: string
  predictionId?: string
  error?: string
}

interface UseVideoGenerationReturn {
  isGenerating: boolean
  generateVideos: (
    shots: ShotAnimationConfig[],
    model: AnimationModel,
    modelSettings: ModelSettings,
    userId: string
  ) => Promise<GenerationResult[]>
}

export function useVideoGeneration(): UseVideoGenerationReturn {
  const [isGenerating, setIsGenerating] = useState(false)

  /**
   * Upload a file to Replicate and return the URL
   */
  const uploadFileToReplicate = async (url: string, filename: string): Promise<string> => {
    // If it's already a Replicate URL or external URL, return as-is
    if (url.startsWith('https') && !url.startsWith('blob:')) {
      return url
    }

    // Convert blob URL to File
    const response = await fetch(url)
    const blob = await response.blob()
    const file = new File([blob], filename, { type: blob.type })

    // Upload to Replicate
    const formData = new FormData()
    formData.append('file', file)

    const uploadResponse = await fetch('/api/upload-file', {
      method: 'POST',
      body: formData,
    })

    if (!uploadResponse.ok) {
      const error = await uploadResponse.json()
      throw new Error(error.error || 'Failed to upload file to Replicate')
    }

    const { url: replicateUrl } = await uploadResponse.json()
    return replicateUrl
  }

  const generateSingleVideo = async (
    shot: ShotAnimationConfig,
    model: AnimationModel,
    modelSettings: ModelSettings,
    userId: string
  ): Promise<GenerationResult> => {
    try {
      // Upload main image to Replicate
      const uploadedImageUrl = await uploadFileToReplicate(shot.imageUrl, shot.imageName)

      // Upload reference images to Replicate
      let uploadedReferenceImages: string[] | undefined
      if (shot.referenceImages.length > 0) {
        uploadedReferenceImages = await Promise.all(
          shot.referenceImages.map((refUrl, index) =>
            uploadFileToReplicate(refUrl, `reference-${index}-${shot.imageName}`)
          )
        )
      }

      // Upload last frame image to Replicate
      let uploadedLastFrameImage: string | undefined
      if (shot.lastFrameImage) {
        uploadedLastFrameImage = await uploadFileToReplicate(
          shot.lastFrameImage,
          `lastframe-${shot.imageName}`
        )
      }

      const requestBody: VideoGenerationRequest = {
        model,
        prompt: shot.prompt,
        image: uploadedImageUrl,
        modelSettings,
        referenceImages: uploadedReferenceImages,
        lastFrameImage: uploadedLastFrameImage,
        user_id: userId,
      }

      const response = await fetch('/api/generation/video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = (await response.json()) as VideoGenerationError
        throw new Error(errorData.details?.join(', ') || errorData.error || 'Generation failed')
      }

      const data = (await response.json()) as VideoGenerationResponse

      return {
        shotId: shot.id,
        success: true,
        galleryId: data.galleryId,
        predictionId: data.predictionId,
      }
    } catch (error) {
      console.error(`Failed to generate video for shot ${shot.id}:`, error)
      return {
        shotId: shot.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  const generateVideos = async (
    shots: ShotAnimationConfig[],
    model: AnimationModel,
    modelSettings: ModelSettings,
    userId: string
  ): Promise<GenerationResult[]> => {
    setIsGenerating(true)

    try {
      // Filter shots that are selected for batch generation
      const selectedShots = shots.filter((shot) => shot.includeInBatch)

      if (selectedShots.length === 0) {
        toast({
          title: 'No Shots Selected',
          description: 'Please select at least one shot to generate videos',
          variant: 'destructive',
        })
        return []
      }

      // Validate that selected shots have prompts
      const shotsWithoutPrompt = selectedShots.filter((shot) => !shot.prompt?.trim())
      if (shotsWithoutPrompt.length > 0) {
        toast({
          title: 'Missing Prompts',
          description: `${shotsWithoutPrompt.length} shot(s) are missing prompts. Please add prompts before generating.`,
          variant: 'destructive',
        })
        return []
      }

      toast({
        title: 'Starting Generation',
        description: `Generating ${selectedShots.length} video(s) using ${model === 'seedance-lite' ? 'Seedance Lite' : 'Seedance Pro'}`,
      })

      // Generate all videos in parallel
      const results = await Promise.all(
        selectedShots.map((shot) => generateSingleVideo(shot, model, modelSettings, userId))
      )

      // Count successes and failures
      const successCount = results.filter((r) => r.success).length
      const failureCount = results.filter((r) => !r.success).length

      // Show result toast
      if (successCount > 0) {
        toast({
          title: 'Generation Started',
          description: `${successCount} video(s) are being generated. You'll see them in the gallery when complete.`,
        })
      }

      if (failureCount > 0) {
        toast({
          title: 'Some Generations Failed',
          description: `${failureCount} video(s) failed to start. Check console for details.`,
          variant: 'destructive',
        })
      }

      return results
    } catch (error) {
      console.error('Batch generation error:', error)
      toast({
        title: 'Generation Error',
        description: error instanceof Error ? error.message : 'Failed to generate videos',
        variant: 'destructive',
      })
      return []
    } finally {
      setIsGenerating(false)
    }
  }

  return {
    isGenerating,
    generateVideos,
  }
}
