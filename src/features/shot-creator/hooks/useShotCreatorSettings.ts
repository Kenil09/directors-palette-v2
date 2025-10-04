import { useEffect, useCallback, useState } from 'react';
import { shotCreatorSettingsService } from '../services';
import { ShotCreatorSettings } from '../types';
import { getClient } from "@/lib/db/client";

const DEFAULT_SETTINGS: ShotCreatorSettings = {
  aspectRatio: "16:9",
  resolution: "2K",
  seed: undefined,
  model: "nano-banana",
  maxImages: 1,
  sequentialGeneration: false,
};

/**
 * Custom hook for managing shot creator settings with Supabase
 * Settings are persisted to Supabase only
 */
export function useShotCreatorSettings() {
  const [settings, setSettings] = useState<ShotCreatorSettings>(DEFAULT_SETTINGS);
  const [isInitialized, setIsInitialized] = useState(false);

  /**
   * Load settings from Supabase on mount (overrides localStorage if available)
   */
  useEffect(() => {
    const loadSettings = async () => {
      const supabase = await getClient()
      if (!supabase) {
        setIsInitialized(true);
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsInitialized(true);
          return;
        }

        const loadedSettings = await shotCreatorSettingsService.loadSettings(user.id);
        if (loadedSettings) {
          const mergedSettings = { ...DEFAULT_SETTINGS, ...loadedSettings };
          setSettings(mergedSettings);
        }
      } catch (error) {
        console.error('Failed to load settings from Supabase:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    loadSettings();
  }, []);

  /**
   * Save settings to both Supabase and localStorage immediately on change
   */
  const updateSettings = useCallback(async (partialSettings: Partial<ShotCreatorSettings>) => {
    // Update local state immediately
    const supabase = await getClient()
    setSettings(prev => {
      const newSettings = { ...prev, ...partialSettings };

      // Save to Supabase in background (don't wait)
      if (supabase) {
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (user) {
            shotCreatorSettingsService.updateSettings(user.id, partialSettings).catch(error => {
              console.error('Failed to save settings to Supabase:', error);
            });
          }
        });
      }

      return newSettings;
    });
  }, []);

  return {
    settings,
    updateSettings,
    isInitialized,
  };
}
