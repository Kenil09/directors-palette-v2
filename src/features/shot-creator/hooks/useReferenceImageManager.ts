"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { getImageDimensions } from "@/features/shot-creator/helpers/short-creator.helper"
import { ShotCreatorReferenceImage } from "../types"
import { useShotCreatorStore } from "../store/shot-creator.store"

export function useReferenceImageManager(maxImages: number = 3) {
    const { toast } = useToast()
    const { shotCreatorReferenceImages, setShotCreatorReferenceImages } = useShotCreatorStore()
    const [fullscreenImage, setFullscreenImage] = useState<ShotCreatorReferenceImage | null>(null)

    // Progressive disclosure logic
    const getVisibleSlots = () => {
        const filledSlots = shotCreatorReferenceImages.length
        if (filledSlots >= 9 && maxImages > 9) return maxImages
        if (filledSlots >= 6) return Math.min(9, maxImages)
        if (filledSlots >= 3) return Math.min(6, maxImages)
        return Math.min(3, maxImages)
    }
    const visibleSlots = getVisibleSlots()

    // Load + Save images in Supabase
    useEffect(() => {
        const loadImages = async () => {
            try {
                // const saved = ''; //TODO: get saved images from supabase
                // if (saved?.length) setShotCreatorReferenceImages(saved)
            } catch (err) {
                console.error("Failed to load reference images:", err)
                toast({ title: "Load Error", description: "Could not load saved reference images", variant: "destructive" })
            }
        }
        loadImages()
    }, [toast, setShotCreatorReferenceImages])

    useEffect(() => {
        const saveImages = async () => {
            try {
                if (shotCreatorReferenceImages.length > 0) {
                    //TODO: save images to supabase for save
                } else {
                    //TODO: clear images from supabase clear remove
                }
            } catch (err) {
                console.error("Failed to save reference images:", err)
                toast({ title: "Save Error", description: "Could not save reference images", variant: "destructive" })
            }
        }
        saveImages()
    }, [shotCreatorReferenceImages, toast])

    // Upload
    const handleShotCreatorImageUpload = async (file: File) => {
        try {
            const reader = new FileReader()
            reader.onload = async (e) => {
                if (!e.target?.result) return
                const imageUrl = e.target.result as string
                const dimensions = await getImageDimensions(file)

                const newImage: ShotCreatorReferenceImage = {
                    id: `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    file,
                    preview: imageUrl,
                    tags: [],
                    detectedAspectRatio: dimensions.aspectRatio
                }

                setShotCreatorReferenceImages([...shotCreatorReferenceImages, newImage])
                toast({ title: "Reference Image Added", description: `Added ${file.name} (${dimensions.aspectRatio})` })
            }
            reader.readAsDataURL(file)
        } catch (err) {
            console.error("Upload error:", err)
            toast({ title: "Upload Failed", description: "Failed to upload reference image", variant: "destructive" })
        }
    }

    // Paste
    const handlePasteImage = async (event?: React.MouseEvent) => {
        if (event) {
            event.preventDefault()
            event.stopPropagation()
        }

        try {
            try {
                const clipboardItems = await navigator.clipboard.read()
                for (const item of clipboardItems) {
                    const imageType = item.types.find((t) => t.startsWith("image/"))
                    if (imageType) {
                        const blob = await item.getType(imageType)
                        const file = new File([blob], `pasted-image.${imageType.split("/")[1]}`, { type: imageType })
                        await handleShotCreatorImageUpload(file)
                        return
                    }
                }
            } catch (readError) {
                console.error("Clipboard read error:", readError)
            }

            const text = await navigator.clipboard.readText()
            if (text && (text.startsWith("http") || text.startsWith("data:image"))) {
                const newImage: ShotCreatorReferenceImage = {
                    id: `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    url: text,
                    preview: text,
                    tags: [],
                    detectedAspectRatio: "16:9",
                    file: undefined
                }
                setShotCreatorReferenceImages([...shotCreatorReferenceImages, newImage])
                toast({ title: "Image Pasted", description: "Image URL pasted from clipboard" })
            } else {
                toast({ title: "No Image Found", description: "No image in clipboard", variant: "destructive" })
            }
        } catch (err) {
            console.error("Paste error:", err)
            toast({ title: "Paste Failed", description: "Unable to paste image", variant: "destructive" })
        }
    }

    // Remove
    const removeShotCreatorImage = (id: string) => {
        setShotCreatorReferenceImages(shotCreatorReferenceImages.filter((img) => img.id !== id))
        toast({ title: "Reference Removed", description: "Reference image removed" })
    }

    return {
        visibleSlots,
        fullscreenImage,
        setFullscreenImage,
        handleShotCreatorImageUpload,
        handlePasteImage,
        removeShotCreatorImage
    }
}
