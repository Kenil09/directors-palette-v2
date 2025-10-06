'use client'

import React from 'react'
import { useShotCreatorStore } from "../store/shot-creator.store"
import { useShotCreatorSettings, useGalleryLoader } from "../hooks"
import { Sparkles } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ModelSelector } from "./ModelSelector"
import { getModelConfig, ModelId } from "@/config/index"
import { CreatorReferenceManager } from "./creator-reference-manager"
import { UnifiedImageGallery } from "./unified-gallery/UnifiedImageGallery"
import { toast } from "@/components/ui/use-toast"
import { useLayoutStore } from "@/store/layout.store"
import ShotReferenceLibrary from "./reference-library/ShotReferenceLibrary"
import CreatorPromptSettings from "./creator-prompt-settings"
import CategorySelectionDialog from "./CategorySelectDialog"
import FullscreenImageModal from "./FullscreenImageModal"

const ShotCreator = () => {
    const { setActiveTab } = useLayoutStore()
    const { settings: shotCreatorSettings, updateSettings } = useShotCreatorSettings()
    const {
        onUseAsReference,
        onSendToShotAnimator,
        onSendToReferenceLibrary,
        fullscreenImage,
        setFullscreenImage,
        categoryDialogOpen,
        setCategoryDialogOpen,
        // setPendingGeneration,
        pendingGeneration,
    } = useShotCreatorStore()

    // Load gallery from Supabase on mount
    const { isLoading: isGalleryLoading } = useGalleryLoader()

    const isEditingMode = shotCreatorSettings.model === 'qwen-image-edit'
    const modelConfig = getModelConfig((shotCreatorSettings.model || 'nano-banana') as ModelId)

    const onSendToImageEdit = (imageUrl: string) => {
        console.log('🎞️ Sending video frame to image editor:', imageUrl)
    }

    const onSendToLayoutAnnotation = (imageUrl: string) => {
        localStorage.setItem('directors-palette-layout-input', imageUrl)
        setActiveTab('layout-annotation')
        toast({
            title: 'Sent to Layout & Annotation',
            description: 'Image has been loaded in the Layout & Annotation tab',
        })
    }

    const handleCategorySave = async (category: string, tags: string[]) => {
        console.log('🔍 handleCategorySave called with category:', category, 'tags:', tags)
        console.log('🔍 pendingGeneration:', pendingGeneration)

        if (pendingGeneration) {
            try {
                // const referenceTag = pendingGeneration.referenceTags?.[0]

                // console.log('🔍 About to call saveImageToLibrary with:', {
                //     imageUrl: pendingGeneration.imageUrl,
                //     tags,
                //     prompt: pendingGeneration.prompt,
                //     source: 'generated',
                //     settings: pendingGeneration.settings,
                //     category,
                //     referenceTag
                // })

                // const savedId = await saveImageToLibrary(
                //     pendingGeneration.imageUrl,
                //     tags,
                //     pendingGeneration.prompt,
                //     'generated',
                //     pendingGeneration.settings,
                //     category as any,
                //     referenceTag
                // )

                // console.log('✅ Image saved to library with ID:', savedId)
                // setPendingGeneration(null)
                // console.log('🔍 Reloading library items...')
                // loadLibraryItems()

                toast({
                    title: "Saved to Library",
                    description: `Image saved to ${category} with ${tags.length} tags`
                })
            } catch (error) {
                console.error('🔴 Error in handleCategorySave:', error)
                toast({
                    title: "Save Failed",
                    description: error instanceof Error ? error.message : "Unknown error occurred",
                    variant: "destructive"
                })
            }
        } else {
            console.log('❌ No pendingGeneration found!')
        }
    }

    return (
        <div className="w-full h-full">
            {/* Mobile-Optimized Header */}
            <div className="flex flex-col space-y-3 lg:flex-row lg:items-center lg:justify-between px-2 lg:px-4 py-3 bg-slate-900/50 border-b border-slate-700 lg:rounded-t-lg">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    <h2 className="text-lg lg:text-xl font-semibold text-white">Shot Creator</h2>
                </div>
                <div className="w-full lg:w-auto">
                    <ModelSelector
                        selectedModel={shotCreatorSettings.model || 'seedream-4'}
                        onModelChange={(model: string) => updateSettings({ model: model as ModelId })}
                        compact={true}
                        showTooltips={false}
                    />
                </div>
            </div>

            {/* Full-Width Mobile Layout */}
            <div className="space-y-4 lg:grid lg:grid-cols-3 lg:gap-6 lg:space-y-0 pb-4">

                {/* LEFT COLUMN - Reference Images & Prompt */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Reference Images Management / Input Image for Editing */}
                    <div className="bg-slate-900/30 lg:rounded-lg lg:border border-slate-700/50 p-0 lg:p-6">
                        <div className="mb-4 px-2 pt-4 lg:px-0 lg:pt-0">
                            <h3 className="text-white font-medium">
                                {isEditingMode ? 'Input Image to Edit' : `Reference Images (Max ${modelConfig.maxReferenceImages || 3})`}
                            </h3>
                            {isEditingMode && (
                                <p className="text-slate-400 text-sm mt-1">
                                    Upload the image you want to edit with AI instructions
                                </p>
                            )}
                        </div>
                        <CreatorReferenceManager
                            compact={false}
                            maxImages={isEditingMode ? 1 : (modelConfig.maxReferenceImages || 3)}
                            editingMode={isEditingMode}
                        />
                    </div>

                    {/* Prompt & Settings */}
                    <div className="bg-slate-900/30 lg:rounded-lg lg:border border-slate-700/50">
                        <CreatorPromptSettings compact={false} />
                    </div>
                </div>

                {/* RIGHT COLUMN - Generated Images & Library */}
                <div className="space-y-6">
                    {/* Single Gallery - Generated Images + Reference Library */}
                    <div className="bg-slate-900/30 lg:rounded-lg lg:border border-slate-700/50">
                        <Tabs defaultValue="generated" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="generated" className="text-xs lg:text-sm">📸 Images</TabsTrigger>
                                <TabsTrigger value="library" className="text-xs lg:text-sm">📚 Library</TabsTrigger>
                            </TabsList>
                            <TabsContent value="generated">
                                <UnifiedImageGallery
                                    currentTab="shot-creator"
                                    isLoading={isGalleryLoading}
                                    onSendToTab={(imageUrl, targetTab) => {
                                        if (targetTab === 'shot-editor' && onSendToImageEdit) {
                                            onSendToImageEdit(imageUrl)
                                        } else if (targetTab === 'layout-annotation' && onSendToLayoutAnnotation) {
                                            onSendToLayoutAnnotation(imageUrl)
                                        }
                                    }}
                                    onSendToLibrary={(imageUrl) => {
                                        if (onSendToReferenceLibrary) {
                                            onSendToReferenceLibrary(imageUrl, setActiveTab);
                                        }
                                    }}
                                    onSendToShotAnimator={(imageUrl) => {
                                        if (onSendToShotAnimator) {
                                            onSendToShotAnimator(imageUrl, setActiveTab);
                                        }
                                    }}
                                    onUseAsReference={(imageUrl) => {
                                        if (onUseAsReference) {
                                            onUseAsReference(imageUrl);
                                        }
                                    }}
                                />
                            </TabsContent>
                            <TabsContent value="library">
                                <ShotReferenceLibrary />
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Category Selection Dialog */}
                    <CategorySelectionDialog
                        open={categoryDialogOpen}
                        onOpenChange={setCategoryDialogOpen}
                        onSave={handleCategorySave}
                        initialTags={[]}
                        imageUrl={pendingGeneration?.imageUrl}
                    />
                    {/* Fullscreen Image Modal */}
                    <FullscreenImageModal
                        // image={fullscreenImage}
                        open={!!fullscreenImage}
                        onOpenChange={(open) => {
                            if (!open) setFullscreenImage(null)
                        }}
                    // onDelete={async (id) => {
                    //     try {
                    //         await referenceLibraryDB.deleteReference(id)
                    //         loadLibraryItems()
                    //         setFullscreenImage(null)
                    //         toast({
                    //             title: "Deleted",
                    //             description: "Reference removed from library"
                    //         })
                    //     } catch (error) {
                    //         toast({
                    //             title: "Delete Failed",
                    //             description: "Could not remove reference",
                    //             variant: "destructive"
                    //         })
                    //     }
                    // }}
                    // onTagEdit={async (id, newTag) => {
                    //     try {
                    //         const ref = await referenceLibraryDB.getReference(id)
                    //         if (ref) {
                    //             const updatedRef = { ...ref, referenceTag: newTag || undefined }
                    //             await referenceLibraryDB.saveReference(updatedRef)
                    //             loadLibraryItems()
                    //             toast({
                    //                 title: "Tag Updated",
                    //                 description: newTag ? `Reference tag set to @${newTag}` : "Reference tag removed"
                    //             })
                    //         }
                    //     } catch (error) {
                    //         toast({
                    //             title: "Update Failed",
                    //             description: "Could not update reference tag",
                    //             variant: "destructive"
                    //         })
                    //     }
                    // }}
                    />
                </div>
            </div>
        </div>
    )
}

export default ShotCreator