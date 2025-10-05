import { SettingsConfig } from "@/features/settings/types/setting.types"
import { DEFAULT_CATEGORIES } from "@/features/shot-creator"
import { DEFAULT_MODEL_SETTINGS } from "@/features/shot-animator/config/models.config"

export const defaultSettings: SettingsConfig = {
    shotAnimator: {
        id: '',
        modelSettings: DEFAULT_MODEL_SETTINGS,
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
