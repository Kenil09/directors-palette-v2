import { create } from "zustand";
import { toast } from "@/components/ui/use-toast";
import { LibraryImageReference, LibraryImageReferences } from "../types/shot-library.types";
import { getClient } from "@/lib/db/client";
import {
    updateReferenceCategory,
    deleteReference,
    updateReferenceTags
} from "../services/reference-library.service";
import { Category } from "../components/CategorySelectDialog";

export type LibraryCategory = 'all' | 'people' | 'places' | 'props' | 'unorganized';
export interface ShotLibraryStore {
    // ---- State ----
    libraryCategory: LibraryCategory;
    libraryItems: LibraryImageReference[];
    libraryLoading: boolean;

    setLibraryCategory: (category: LibraryCategory) => void;
    setLibraryItems: (items: LibraryImageReference[]) => void;
    setLibraryLoading: (loading: boolean) => void;
    loadLibraryItems: () => Promise<void>;
    updateItemCategory: (itemId: string, newCategory: string) => Promise<void>;
    deleteItem: (itemId: string) => Promise<void>;
    updateItemTags: (itemId: string, tags: string[]) => Promise<void>;
}

export const useLibraryStore = create<ShotLibraryStore>()((set) => ({
    libraryCategory: 'all',
    libraryItems: [],
    libraryLoading: false,
    // ---- Actions ----    
    setLibraryCategory: (category: LibraryCategory) => set({ libraryCategory: category }),
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
                category: ref.category as Category,
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

    updateItemCategory: async (itemId: string, newCategory: string) => {
        try {
            const { error } = await updateReferenceCategory(itemId, newCategory)

            if (error) throw error

            // Update local state
            set((state) => ({
                libraryItems: state.libraryItems.map(item =>
                    item.id === itemId
                        ? { ...item, category: newCategory as Category }
                        : item
                )
            }))

            toast({
                title: "Category Updated",
                description: `Item moved to ${newCategory}`
            })
        } catch (error) {
            console.error('Failed to update category:', error)
            toast({
                title: "Update Failed",
                description: "Failed to update category",
                variant: "destructive"
            })
        }
    },

    deleteItem: async (itemId: string) => {
        try {
            const { error } = await deleteReference(itemId)

            if (error) throw error

            // Update local state
            set((state) => ({
                libraryItems: state.libraryItems.filter(item => item.id !== itemId)
            }))

            toast({
                title: "Deleted",
                description: "Reference removed from library"
            })
        } catch (error) {
            console.error('Failed to delete item:', error)
            toast({
                title: "Delete Failed",
                description: "Failed to remove reference",
                variant: "destructive"
            })
        }
    },

    updateItemTags: async (itemId: string, tags: string[]) => {
        try {
            const { error } = await updateReferenceTags(itemId, tags)

            if (error) throw error

            // Update local state
            set((state) => ({
                libraryItems: state.libraryItems.map(item =>
                    item.id === itemId
                        ? { ...item, tags }
                        : item
                )
            }))

            toast({
                title: "Tags Updated",
                description: "Reference tags have been updated"
            })
        } catch (error) {
            console.error('Failed to update tags:', error)
            toast({
                title: "Update Failed",
                description: "Failed to update tags",
                variant: "destructive"
            })
        }
    },

}));
