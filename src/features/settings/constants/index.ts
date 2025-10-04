import { SettingsConfig } from "@/features/settings/types/setting.types"
import { DEFAULT_CATEGORIES } from "@/features/shot-creator"

export const defaultSettings: SettingsConfig = {
    shotAnimator: {
        id: '',
    },
    shotCreator: {
        aspectRatio: "16:9",
        resolution: "2K",
        seed: undefined,
        model: "nano-banana",
        maxImages: 1,
        sequentialGeneration: false,
        promptLibrary: {
            categories: DEFAULT_CATEGORIES,
            prompts: [],
            quickPrompts: []
        }
    },
}
