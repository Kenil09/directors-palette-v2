/**
 * Video Generation Service
 * Handles Seedance model input validation and Replicate input building
 */

import type { AnimationModel, ModelSettings } from '../types'

export interface VideoGenerationInput {
  model: AnimationModel
  prompt: string
  image: string // Base image URL for image-to-video
  modelSettings: ModelSettings
  referenceImages?: string[] // Only for seedance-lite (1-4 images)
  lastFrameImage?: string
}

export interface ReplicateVideoInput {
  prompt: string
  image: string
  duration: number
  resolution: string
  aspect_ratio: string
  fps: number
  camera_fixed: boolean
  seed?: number
  reference_images?: string[]
  last_frame_image?: string
}

export class VideoGenerationService {
  /**
   * Validate input based on model-specific constraints
   */
  static validateInput(input: VideoGenerationInput): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Common validations
    if (!input.prompt?.trim()) {
      errors.push('Prompt is required')
    }

    if (!input.image) {
      errors.push('Base image is required for image-to-video generation')
    }

    // Model-specific validations
    if (input.model === 'seedance-lite') {
      errors.push(...this.validateSeedanceLite(input))
    } else if (input.model === 'seedance-pro') {
      errors.push(...this.validateSeedancePro(input))
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Validate Seedance-1-lite specific constraints
   */
  private static validateSeedanceLite(input: VideoGenerationInput): string[] {
    const errors: string[] = []

    // Reference images validation
    if (input.referenceImages && input.referenceImages.length > 0) {
      if (input.referenceImages.length > 4) {
        errors.push('Seedance Lite supports maximum 4 reference images')
      }

      // Reference images cannot be used with 1080p
      if (input.modelSettings.resolution === '1080p') {
        errors.push('Reference images cannot be used with 1080p resolution in Seedance Lite')
      }

      // Reference images cannot be used with first/last frame images
      if (input.lastFrameImage) {
        errors.push('Reference images cannot be used with last frame image in Seedance Lite')
      }
    }

    return errors
  }

  /**
   * Validate Seedance-1-pro specific constraints
   */
  private static validateSeedancePro(input: VideoGenerationInput): string[] {
    const errors: string[] = []

    // Seedance Pro does NOT support reference images
    if (input.referenceImages && input.referenceImages.length > 0) {
      errors.push('Seedance Pro does not support reference images')
    }

    // Last frame only works if start frame image is provided
    if (input.lastFrameImage && !input.image) {
      errors.push('Last frame image only works when a start frame image is provided in Seedance Pro')
    }

    return errors
  }

  /**
   * Build Replicate input object based on model
   */
  static buildReplicateInput(input: VideoGenerationInput): ReplicateVideoInput {
    const replicateInput: ReplicateVideoInput = {
      prompt: input.prompt,
      image: input.image,
      duration: input.modelSettings.duration,
      resolution: input.modelSettings.resolution,
      aspect_ratio: input.modelSettings.aspectRatio,
      fps: input.modelSettings.fps,
      camera_fixed: input.modelSettings.cameraFixed,
    }

    // Add optional seed
    if (input.modelSettings.seed !== undefined && input.modelSettings.seed !== null) {
      replicateInput.seed = input.modelSettings.seed
    }

    // Add reference images (only for seedance-lite)
    if (input.model === 'seedance-lite' && input.referenceImages && input.referenceImages.length > 0) {
      replicateInput.reference_images = input.referenceImages
    }

    // Add last frame image
    if (input.lastFrameImage) {
      replicateInput.last_frame_image = input.lastFrameImage
    }

    return replicateInput
  }

  /**
   * Get Replicate model identifier
   */
  static getReplicateModelId(model: AnimationModel): string {
    const modelMap: Record<AnimationModel, string> = {
      'seedance-lite': 'bytedance/seedance-1-lite',
      'seedance-pro': 'bytedance/seedance-1-pro',
    }

    return modelMap[model]
  }

  /**
   * Build metadata for database storage
   */
  static buildMetadata(input: VideoGenerationInput) {
    return {
      prompt: input.prompt,
      model: this.getReplicateModelId(input.model),
      duration: input.modelSettings.duration,
      resolution: input.modelSettings.resolution,
      aspect_ratio: input.modelSettings.aspectRatio,
      fps: input.modelSettings.fps,
      camera_fixed: input.modelSettings.cameraFixed,
      seed: input.modelSettings.seed,
      has_reference_images: input.referenceImages && input.referenceImages.length > 0,
      reference_images_count: input.referenceImages?.length || 0,
      has_last_frame: !!input.lastFrameImage,
    }
  }
}
