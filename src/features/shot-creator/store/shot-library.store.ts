import { create } from "zustand";
import { toast } from "@/components/ui/use-toast";
import { LibraryImageReference, LibraryImageReferences } from "../types/shot-library.types";
import { getClient } from "@/lib/db/client";

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

export const useLibraryStore = create<ShotLibraryStore>()((set) => ({
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
            const supabase = await getClient()

            // Get user
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('User not authenticated')

            // Fetch reference items with their gallery data
            const { data: references, error } = await supabase
                .from('reference')
                .select(`
                            id,
                            category,
                            tags,
                            created_at,
                            gallery (
                                id,
                                public_url,
                                metadata
                            )
                        `)
                .eq('gallery.user_id', user.id)
                .order('created_at', { ascending: false })

            if (error) throw error

            // Transform to LibraryImageReference format
            const items: LibraryImageReference[] = (references || []).map((ref: LibraryImageReferences) => ({
                id: ref.id,
                imageData: ref.gallery?.public_url || '',
                preview: ref.gallery?.public_url || '',
                tags: ref.tags || [],
                category: ref.category as 'people' | 'places' | 'props' | 'unorganized',
                prompt: (ref.gallery?.metadata as { prompt?: string })?.prompt || '',
                createdAt: new Date(ref.created_at),
                source: 'generated' as const,
                settings: ref.gallery?.metadata as LibraryImageReference['settings'],
            }))

            set({ libraryItems: items })
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

}));
