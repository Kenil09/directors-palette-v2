/**
 * Image Generation Types
 * Type definitions for multi-model image generation support
 */

import type { ModelId } from '@/config'

// Available image generation models
export type ImageModel = Extract<ModelId,
  | 'nano-banana'
  | 'seedream-4'
  | 'gen4-image'
  | 'gen4-image-turbo'
  | 'qwen-image'
  | 'qwen-image-edit'
>

// Model-specific settings interfaces
export interface NanoBananaSettings {
  aspectRatio?: string
  outputFormat?: 'jpg' | 'png'
}

export interface SeedreamSettings {
  size?: '1K' | '2K' | '4K' | 'custom'
  aspectRatio?: string
  width?: number
  height?: number
  sequentialImageGeneration?: 'disabled' | 'auto'
  maxImages?: number
}

export interface Gen4Settings {
  seed?: number
  resolution?: '720p' | '1080p'
  aspectRatio?: string
  referenceTags?: string[]
}

export interface QwenImageSettings {
  seed?: number
  image?: string // For img2img
  guidance?: number
  strength?: number
  aspectRatio?: string
  numInferenceSteps?: number
  outputFormat?: 'webp' | 'jpg' | 'png'
  goFast?: boolean
}

export interface QwenImageEditSettings {
  image: string // Required for editing
  aspectRatio?: string
  seed?: number
  outputFormat?: 'webp' | 'jpg' | 'png'
  outputQuality?: number
  goFast?: boolean
}

// Union type for all model settings
export type ImageModelSettings =
  | NanoBananaSettings
  | SeedreamSettings
  | Gen4Settings
  | QwenImageSettings
  | QwenImageEditSettings

// Input for image generation service
export interface ImageGenerationInput {
  model: ImageModel
  prompt: string
  referenceImages?: string[]
  modelSettings: ImageModelSettings
  userId: string
}

// Replicate API input schemas (union type for different models)
export interface NanoBananaInput {
  prompt: string
  image_input?: string[]
  aspect_ratio?: string
  output_format?: string
}

export interface SeedreamInput {
  prompt: string
  image_input?: string[]
  size?: string
  aspect_ratio?: string
  width?: number
  height?: number
  sequential_image_generation?: string
  max_images?: number
}

export interface Gen4Input {
  prompt: string
  reference_images?: string[]
  reference_tags?: string[]
  seed?: number
  resolution?: string
  aspect_ratio?: string
}

export interface QwenImageInput {
  prompt: string
  image?: string
  seed?: number
  guidance?: number
  strength?: number
  aspect_ratio?: string
  num_inference_steps?: number
  output_format?: string
  go_fast?: boolean
}

export interface QwenImageEditInput {
  prompt: string
  image: string
  aspect_ratio?: string
  seed?: number
  output_format?: string
  output_quality?: number
  go_fast?: boolean
}

// Union type for all Replicate inputs
export type ReplicateImageInput =
  | NanoBananaInput
  | SeedreamInput
  | Gen4Input
  | QwenImageInput
  | QwenImageEditInput

// API Request/Response types
export interface ImageGenerationRequest {
  model: ImageModel
  prompt: string
  referenceImages?: string[]
  modelSettings: ImageModelSettings
  user_id: string
}

export interface ImageGenerationResponse {
  predictionId: string
  galleryId: string
  status: string
}

export interface ImageGenerationError {
  error: string
  details?: string[]
}
