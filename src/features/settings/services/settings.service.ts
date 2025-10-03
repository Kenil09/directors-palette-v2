import { SettingsConfig } from '@/features/settings/types/setting.types'
import { defaultSettings } from '@/features/settings/constants'
import { SupabaseSettingsRepository } from "@/lib/db/repositories/settings.repository"

export interface SettingsService {
  getByUserId(userId: string): Promise<SettingsConfig>
  upsert(userId: string, config: Partial<SettingsConfig>): Promise<SettingsConfig>
}

export class SettingsServiceImpl implements SettingsService {
  constructor(private repository: SupabaseSettingsRepository) { }

  async getByUserId(userId: string): Promise<SettingsConfig> {
    try {
      const result = await this.repository.findByUserId(userId)

      if (!result || !result.data.config) {
        // Return default settings if no settings found
        return defaultSettings
      }

      // Merge with default settings to ensure all properties exist
      const userConfig = result.data.config as Partial<SettingsConfig>
      return this.mergeWithDefaults(userConfig)
    } catch (error) {
      console.error('Error getting settings:', error)
      // Return default settings on error
      return defaultSettings
    }
  }

  async upsert(userId: string, config: Partial<SettingsConfig>): Promise<SettingsConfig> {
    try {
      // Get current settings first
      const currentSettings = await this.getByUserId(userId)

      // Deep merge the configs with correct structure
      const mergedConfig: SettingsConfig = {
        shotCreator: {
          ...currentSettings.shotCreator,
          ...(config.shotCreator || {})
        },
        shotAnimator: {
          ...currentSettings.shotAnimator,
          ...(config.shotAnimator || {})
        },
      }

      // Upsert to database
      const result = await this.repository.upsert({
        user_id: userId,
        config: mergedConfig as unknown as Record<string, unknown>
      })
      const finalConfig = result.data.config as unknown as SettingsConfig
      return finalConfig
    } catch (error) {
      console.error('Error upserting settings:', error)
      throw error
    }
  }

  private mergeWithDefaults(userConfig: Partial<SettingsConfig>): SettingsConfig {
    return {
      shotCreator: {
        ...defaultSettings.shotCreator,
        ...(userConfig.shotCreator || {})
      },
      shotAnimator: {
        ...defaultSettings.shotAnimator,
        ...(userConfig.shotAnimator || {})
      },
    }
  }
}

// Create singleton instance
const settingsRepository = new SupabaseSettingsRepository()
export const settingsService = new SettingsServiceImpl(settingsRepository)
