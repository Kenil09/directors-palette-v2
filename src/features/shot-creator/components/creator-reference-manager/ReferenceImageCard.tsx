"use client"

import * as React from "react"
import Image from "next/image"
import { Upload, Clipboard, Expand, Trash2, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import InlineTagEditor from "./InlineTagEditor"

// ImageData type can be extended
export interface ShotImage {
    id: string
    preview: string
    tags: string[]
}

interface ReferenceImageCardProps {
    index: number
    image?: ShotImage
    isEmpty?: boolean
    editingTagsId: string | null
    setEditingTagsId: React.Dispatch<React.SetStateAction<string | null>>
    shotCreatorReferenceImages: ShotImage[]
    setShotCreatorReferenceImages: React.Dispatch<React.SetStateAction<ShotImage[]>>
    handleShotCreatorImageUpload: (file: File) => void
    handlePasteImage: (e: React.MouseEvent<HTMLButtonElement>) => void
    removeShotCreatorImage: (id: string) => void
    setFullscreenImage: (img: ShotImage) => void
}

export function ReferenceImageCard({
    index,
    image,
    isEmpty = false,
    editingTagsId,
    setEditingTagsId,
    shotCreatorReferenceImages,
    setShotCreatorReferenceImages,
    handleShotCreatorImageUpload,
    handlePasteImage,
    removeShotCreatorImage,
    setFullscreenImage
}: ReferenceImageCardProps) {
    return (
        <div key={index} className="space-y-3">
            {/* Upload / Preview Box */}
            <div
                className={`relative rounded-xl overflow-hidden transition-all ${isEmpty
                    ? "min-h-[240px] md:min-h-[160px] md:aspect-square bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 hover:border-slate-600 cursor-pointer touch-manipulation"
                    : "border-2 border-purple-500 bg-purple-900/20 shadow-lg shadow-purple-500/20"
                    }`}
                onClick={
                    isEmpty
                        ? () => {
                            const input = document.createElement("input")
                            input.type = "file"
                            input.accept = "image/*"
                            input.onchange = (e) => {
                                const files = (e.target as HTMLInputElement).files
                                if (files?.[0]) {
                                    handleShotCreatorImageUpload(files[0])
                                }
                            }
                            input.click()
                        }
                        : undefined
                }
            >
                {image ? (
                    <>
                        <Image
                            src={image.preview}
                            alt={`Reference ${index + 1}`}
                            width={250}
                            height={250}
                            className="w-full h-full object-cover md:object-contain cursor-pointer"
                            onClick={() => setFullscreenImage(image)}
                        />
                        {/* Fullscreen button */}
                        <Button
                            size="sm"
                            variant="ghost"
                            className="absolute bottom-2 left-2 h-8 w-8 p-0 md:h-6 md:w-6 bg-black/50 hover:bg-black/70"
                            onClick={() => setFullscreenImage(image)}
                        >
                            <Expand className="h-4 w-4 md:h-3 md:w-3 text-white" />
                        </Button>
                        {/* Delete button */}
                        <Button
                            size="sm"
                            variant="destructive"
                            className="absolute top-2 right-2 h-8 w-8 p-0 md:h-6 md:w-6"
                            onClick={(e) => {
                                e.stopPropagation()
                                removeShotCreatorImage(image.id)
                            }}
                        >
                            <Trash2 className="h-4 w-4 md:h-3 md:w-3" />
                        </Button>
                    </>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center p-8">
                            <Upload className="h-12 w-12 md:h-8 md:w-8 text-slate-500 mx-auto mb-3 md:mb-2" />
                            <p className="text-sm md:text-xs text-slate-400 font-medium">
                                Tap to add Reference {index + 1}
                            </p>
                            <p className="text-xs text-slate-500 mt-1 md:hidden">or use buttons below</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-4 md:flex md:flex-row md:gap-2">
                <Button
                    size="lg"
                    variant="outline"
                    className="h-16 md:h-8 md:flex-1 border-slate-600 hover:border-slate-500 bg-slate-800/50 hover:bg-slate-800 flex items-center justify-center"
                    onClick={handlePasteImage}
                >
                    <Clipboard className="h-6 w-6 md:h-4 md:w-4" />
                    <span className="ml-2 md:ml-1 text-sm md:text-xs">Paste</span>
                </Button>
                <Button
                    size="lg"
                    variant="outline"
                    className="h-16 md:h-8 md:flex-1 border-slate-600 hover:border-slate-500 bg-slate-800/50 hover:bg-slate-800 flex items-center justify-center"
                    onClick={() => {
                        const input = document.createElement("input")
                        input.type = "file"
                        input.accept = "image/*"
                        input.onchange = (e) => {
                            const files = (e.target as HTMLInputElement).files
                            if (files?.[0]) {
                                handleShotCreatorImageUpload(files[0])
                            }
                        }
                        input.click()
                    }}
                >
                    <Upload className="h-6 w-6 md:h-4 md:w-4" />
                    <span className="ml-2 md:ml-1 text-sm md:text-xs">Browse</span>
                </Button>
            </div>

            {/* Tags section */}
            {image && (
                <div className="space-y-1">
                    <Label className="text-xs text-slate-400">Tags</Label>
                    {editingTagsId === image.id ? (
                        <InlineTagEditor
                            initialTags={image.tags}
                            onSave={(newTags: string[]) => {
                                const updatedImages = shotCreatorReferenceImages.map((img) =>
                                    img.id === image.id ? { ...img, tags: newTags } : img
                                )
                                setShotCreatorReferenceImages(updatedImages)
                                setEditingTagsId(null)
                            }}
                            onCancel={() => setEditingTagsId(null)}
                        />
                    ) : (
                        <div className="flex items-center gap-1">
                            <div className="flex-1">
                                {image.tags.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                        {image.tags.map((tag, tagIndex) => (
                                            <Badge key={tagIndex} variant="outline" className="text-xs">
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-xs text-slate-500">No tags</span>
                                )}
                            </div>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-5 w-5 p-0"
                                onClick={() => setEditingTagsId(image.id)}
                            >
                                <Edit className="h-3 w-3" />
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
