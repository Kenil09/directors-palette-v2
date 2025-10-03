
// Settings configuration types
export interface ShotAnimatorSettings {
    id?: string
}

export interface promptCategories {
    icon: string
    name: string
}
export interface Prompt {
    title: string
    prompt: string,
    category: string,
    tags: string[],
    quickAccess: boolean
}
export interface PromptLibrarySettings {
    categories: promptCategories[]
    prompts: Prompt[]
}
export interface ShotCreatorSettings {
    id?: string
    aspectRatio: string
    resolution: string
    seed?: number
    model?: 'nano-banana' | 'gen4-image' | 'gen4-image-turbo' | 'seedream-4' | 'qwen-image' | 'qwen-image-edit'
    maxImages?: number
    sequentialGeneration?: boolean
    promptLibrary?: PromptLibrarySettings
}

export interface SettingsConfig {
    shotCreator: ShotCreatorSettings
    shotAnimator: ShotAnimatorSettings
}