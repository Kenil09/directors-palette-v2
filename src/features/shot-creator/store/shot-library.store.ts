import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { toast } from "@/components/ui/use-toast";
import { LibraryImageReference } from "../types/shot-library.types";

export interface ShotLibraryStore {
    // ---- State ----
    libraryCategory: 'all' | 'people' | 'places' | 'props' | 'unorganized';
    libraryItems: LibraryImageReference[];
    libraryLoading: boolean;

    setLibraryCategory: (category: 'all' | 'people' | 'places' | 'props' | 'unorganized') => void;
    setLibraryItems: (items: LibraryImageReference[]) => void;
    setLibraryLoading: (loading: boolean) => void;
    loadLibraryItems: () => Promise<void>;    
}

export const useLibraryStore = create<ShotLibraryStore>()(
    persist(
        (set) => ({
            libraryCategory: 'all',
            libraryItems: [],
            libraryLoading: false,
            // ---- Actions ----    
            setLibraryCategory: (category: 'all' | 'people' | 'places' | 'props' | 'unorganized') => set({ libraryCategory: category }),
            setLibraryItems: (items: LibraryImageReference[]) => set({ libraryItems: items }),
            setLibraryLoading: (loading: boolean) => set({ libraryLoading: loading }),

            loadLibraryItems: async () => {
                set({ libraryLoading: true })
                try {
                    // get library image items from supabase and add in the libraryItems
                    // set({ libraryItems: items as LibraryImageReference[] })
                } catch (error) {
                    console.error('Failed to load library:', error)
                    toast({
                        title: "Library Error",
                        description: "Failed to load reference library",
                        variant: "destructive"
                    })
                } finally {
                    set({ libraryLoading: false })
                }
            },

        }),
        {
            name: "shot-animator-storage",
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                libraryCategory: state.libraryCategory,
                libraryItems: state.libraryItems,
                libraryLoading: state.libraryLoading,
            }),
        }
    )
);
