import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { ShotCreatorGeneration, ShotCreatorReferenceImage } from "../types";
import { ImageData } from "../../shot-animator/types";
import { toast } from "@/hooks/use-toast";
import { generateId, getImageDimensions } from "@/features/shot-creator/helpers/short-creator.helper";
import { LibraryImageReference } from "../types/shot-library.types";

export interface ShotCreatorStore {
    // ---- State ----
    shotCreatorReferenceImages: ShotCreatorReferenceImage[];
    shotCreatorPrompt: string;
    shotCreatorGenerations: ShotCreatorGeneration[];
    shotCreatorProcessing: boolean;
    fullscreenImage: LibraryImageReference | null;
    generatedShotIds: Set<string>;

    // ---- Actions ----
    setShotCreatorReferenceImages: (images: ShotCreatorReferenceImage[] | ((prev: ShotCreatorReferenceImage[]) => ShotCreatorReferenceImage[])) => void;
    setShotCreatorPrompt: (prompt: string) => void;
    setShotCreatorGenerations: (generations: ShotCreatorGeneration[]) => void;
    setShotCreatorProcessing: (processing: boolean) => void;
    setGeneratedShotIds: (ids: Set<string>) => void;

    // full screen
    setFullscreenImage: (image: LibraryImageReference | null) => void;
    resetStore: () => void;

    // functions
    onSendToReferenceLibrary: (imageUrl: string, setActiveTab: (tab: string) => void) => void;
    onUseAsReference: (imageUrl: string) => Promise<void>;
    onSendToShotAnimator: (imageUrl: string, setActiveTab: (tab: string) => void) => Promise<void>;
    onSendToWorkspace: (imageUrl: string) => Promise<void>;
}

export const useShotCreatorStore = create<ShotCreatorStore>()(
    persist(
        (set) => ({
            shotCreatorReferenceImages: [],
            shotCreatorPrompt: "",
            shotCreatorGenerations: [],
            shotCreatorProcessing: false,
            fullscreenImage: null,
            generatedShotIds: new Set(),
            // ---- Actions ----
            setShotCreatorReferenceImages: (images) =>
                set((state) => ({
                    shotCreatorReferenceImages: typeof images === 'function' ? images(state.shotCreatorReferenceImages) : images
                })),
            setGeneratedShotIds: (ids) => set({ generatedShotIds: ids }),
            setShotCreatorPrompt: (prompt) => set({ shotCreatorPrompt: prompt }),
            setShotCreatorGenerations: (generations) => set({ shotCreatorGenerations: generations }),
            setShotCreatorProcessing: (processing) => set({ shotCreatorProcessing: processing }),
            setFullscreenImage: (image) => set({ fullscreenImage: image }),
            resetStore: () =>
                set({
                    shotCreatorReferenceImages: [],
                    shotCreatorPrompt: "",
                    shotCreatorGenerations: [],
                    shotCreatorProcessing: false,
                    fullscreenImage: null,
                }),

            onSendToReferenceLibrary: (imageUrl: string, setActiveTab: (tab: string) => void) => {
                localStorage.setItem('directors-palette-layout-input', imageUrl);
                setActiveTab('layout-annotation');
                toast({
                    title: 'Sent to Layout & Annotation',
                    description: 'Image has been loaded in the Layout & Annotation tab',
                });
            },

            onUseAsReference: async (imageUrl: string) => {
                try {
                    const response = await fetch(imageUrl);
                    const blob = await response.blob();
                    const file = new File([blob], 'reference-image.png', { type: blob.type });
                    const preview = URL.createObjectURL(blob);
                    const dimensions = await getImageDimensions(file);

                    const newImage: ShotCreatorReferenceImage = {
                        id: `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        file,
                        preview,
                        tags: [],
                        detectedAspectRatio: dimensions.aspectRatio,
                    };

                    set((state) => ({
                        shotCreatorReferenceImages: [...state.shotCreatorReferenceImages, newImage],
                    }));

                    toast({
                        title: "Reference Added",
                        description: "Image added to reference slots"
                    });
                } catch (error) {
                    console.error('Error adding reference image:', error);
                    toast({
                        title: "Error",
                        description: "Failed to add image as reference",
                        variant: "destructive"
                    });
                }
            },

            onSendToShotAnimator: async (imageUrl: string, setActiveTab: (tab: string) => void) => {
                if (!imageUrl) return;

                try {
                    const existingRefs = ''; //TODO: get existing refs from supabase
                    // const isDuplicate = existingRefs.some(ref => ref.fileUrl === imageUrl);
                    // if (isDuplicate) {
                    //     toast({
                    //         title: "Duplicate Image",
                    //         description: "This image is already in the Shot Animator",
                    //         variant: "default"
                    //     });
                    //     return;
                    // }

                    const response = await fetch(imageUrl);
                    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);

                    const blob = await response.blob();
                    const base64data = await new Promise<string>((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result as string);
                        reader.onerror = reject;
                        reader.readAsDataURL(blob);
                    });

                    const file = new File([blob], `shotAnimator-${Date.now()}.png`, { type: 'image/png' });
                    const referenceId = generateId();

                    const newRef: ImageData = {
                        id: referenceId,
                        fileUrl: imageUrl,
                        preview: base64data,
                        prompt: '',
                        selected: false,
                        status: 'idle',
                        videos: [],
                        filename: file.name,
                        type: file.type,
                        size: file.size,
                        file: file,
                        lastFrame: null,
                        lastFrameFile: undefined,
                        lastFramePreview: null,
                        mode: 'seedance',
                        referenceImages: [],
                        editHistory: []
                    };

                    const updatedRefs = [...existingRefs, newRef];
                    console.log("updatedRefs", updatedRefs);
                    toast({
                        title: "Image Sent to Animator",
                        description: "The image has been added to the Shot Animator",
                    });

                    setTimeout(() => setActiveTab('workspace'), 100);
                } catch (error) {
                    console.error('Failed to save animator reference:', error);
                    toast({
                        title: "Error",
                        description: "Failed to send image to Shot Animator",
                        variant: "destructive",
                    });
                }
            },

            onSendToWorkspace: async (imageUrl) => {
                try {
                    if (!imageUrl) return;

                    const response = await fetch(imageUrl);
                    const blob = await response.blob();
                    const file = new File([blob], `gen4_${Date.now()}.png`, { type: 'image/png' });

                    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
                    const preview = URL.createObjectURL(file);

                    const newImage: ImageData = {
                        id,
                        file,
                        preview,
                        prompt: '',
                        selected: false,
                        status: 'idle',
                        mode: 'seedance',
                    }
                    console.log("newImage", newImage)
                    // set((state) => ({
                    //     shotCreatorGenerations: [...state.shotCreatorGenerations, newImage],
                    // }));

                    toast({
                        title: 'Added to Workspace',
                        description: 'Image has been added to your workspace.',
                    });
                } catch (error) {
                    console.error('Error sending to workspace:', error);
                    toast({
                        title: 'Error',
                        description: 'Failed to add image to workspace.',
                        variant: 'destructive',
                    });
                }
            },
        }),
        {
            name: "shot-creator-storage",
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                shotCreatorReferenceImages: state.shotCreatorReferenceImages,
                shotCreatorPrompt: state.shotCreatorPrompt,
                shotCreatorGenerations: state.shotCreatorGenerations,
                shotCreatorProcessing: state.shotCreatorProcessing,
                fullscreenImage: state.fullscreenImage,
            }),
        }
    )
);
