/**
 * Image Generation Service
 * Handles API calls for image generation using Replicate
 * Images are processed via webhook and saved to Supabase
 */

export interface ImageGenerationRequest {
    prompt: string
    referenceImages?: string[]
    format?: 'jpg' | 'png' | 'webp'
    user_id: string
}

export interface ImageGenerationResponse {
    predictionId: string
    galleryId: string
    status: string
}

export class ImageGenerationService {
    private baseUrl = '/api'

    /**
     * Start a new image generation
     * Images will be processed by webhook and saved to Supabase gallery
     */
    async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/generation/image`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to start image generation')
            }

            return await response.json()
        } catch (error) {
            console.error('Image generation error:', error)
            throw error
        }
    }
}

// Singleton instance
export const imageGenerationService = new ImageGenerationService()
