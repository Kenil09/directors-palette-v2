import { useEffect, useCallback, useState } from 'react';
import { shotCreatorSettingsService } from '../services';
import { ShotCreatorSettings } from '../types';
import { getClient } from "@/lib/db/client";

const STORAGE_KEY = 'shot-creator-settings';

const DEFAULT_SETTINGS: ShotCreatorSettings = {
  aspectRatio: "16:9",
  resolution: "2K",
  seed: undefined,
  model: "nano-banana",
  maxImages: 1,
  sequentialGeneration: false,
};

/**
 * Check if we're running in the browser
 */
const isBrowser = typeof window !== 'undefined';

/**
 * Load settings from localStorage cache
 */
const loadFromLocalStorage = (): ShotCreatorSettings => {
  if (!isBrowser) return DEFAULT_SETTINGS;

  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(cached) };
    }
  } catch (error) {
    console.error('Failed to load settings from localStorage:', error);
  }
  return DEFAULT_SETTINGS;
};

/**
 * Save settings to localStorage cache
 */
const saveToLocalStorage = (settings: ShotCreatorSettings) => {
  if (!isBrowser) return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings to localStorage:', error);
  }
};

/**
 * Custom hook for managing shot creator settings with Supabase sync
 * Settings are persisted to both Supabase and localStorage for instant load
 */
export function useShotCreatorSettings() {
  // Initialize from localStorage first for instant load
  const [settings, setSettings] = useState<ShotCreatorSettings>(loadFromLocalStorage);
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
          saveToLocalStorage(mergedSettings);
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

      // Save to localStorage immediately for persistence across refreshes
      saveToLocalStorage(newSettings);

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
