import { ModelConfig, AnimationModel, ModelSettings } from '../types'

/**
 * Animation Model Configurations
 */
export const ANIMATION_MODELS: Record<AnimationModel, ModelConfig> = {
  'seedance-lite': {
    id: 'seedance-lite',
    displayName: 'Seedance Lite',
    description: 'Fast video generation with reference image support',
    maxReferenceImages: 4,
    supportsLastFrame: true,
    defaultResolution: '720p',
    restrictions: [
      'Reference images cannot be used with 1080p resolution',
      'Last frame image only works if a start frame image is provided'
    ]
  },
  'seedance-pro': {
    id: 'seedance-pro',
    displayName: 'Seedance Pro',
    description: 'High-quality video generation with better results',
    maxReferenceImages: 0,
    supportsLastFrame: true,
    defaultResolution: '1080p',
    restrictions: []
  }
}

/**
 * Default model settings
 */
export const DEFAULT_MODEL_SETTINGS: Record<AnimationModel, ModelSettings> = {
  'seedance-lite': {
    duration: 5,
    resolution: '720p',
    aspectRatio: '16:9',
    fps: 24,
    cameraFixed: false
  },
  'seedance-pro': {
    duration: 5,
    resolution: '1080p',
    aspectRatio: '16:9',
    fps: 24,
    cameraFixed: false
  }
}

/**
 * Duration constraints
 */
export const DURATION_CONSTRAINTS = {
  min: 3,
  max: 12,
  default: 5
}

/**
 * Available resolutions
 */
export const RESOLUTIONS = ['480p', '720p', '1080p'] as const

/**
 * Available aspect ratios
 */
export const ASPECT_RATIOS = [
  { value: '16:9', label: '16:9 (Landscape)' },
  { value: '4:3', label: '4:3 (Standard)' },
  { value: '1:1', label: '1:1 (Square)' },
  { value: '3:4', label: '3:4 (Portrait)' },
  { value: '9:16', label: '9:16 (Vertical)' },
  { value: '21:9', label: '21:9 (Ultrawide)' },
  { value: '9:21', label: '9:21 (Vertical Ultra)' }
] as const
