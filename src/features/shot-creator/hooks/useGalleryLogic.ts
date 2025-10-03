'use client'

import { useState, useMemo, useCallback } from 'react'
import { useUnifiedGalleryStore } from '../store/unified-gallery-store'
import { useToast } from '@/components/ui/use-toast'

// Re-export types from the store for convenience
export interface GalleryImage {
  url: string
  prompt: string
  timestamp: number
  model?: string
  creditsUsed?: number
  source?: string
  reference?: string
  chain?: {
    chainId: string
    stepNumber: number
    stepPrompt: string
  }
}

export interface ChainData {
  chainId: string
  images: GalleryImage[]
  totalCredits: number
  startTime: number
  endTime: number
}

export type ViewMode = 'grid' | 'chains'

export interface GalleryFilters {
  searchQuery: string
  currentPage: number
  viewMode: ViewMode
}
export function useGalleryLogic(
  onSendToTab?: (imageUrl: string, targetTab: string) => void,
  onUseAsReference?: (imageUrl: string) => void,
  onSendToShotAnimator?: (imageUrl: string) => void,
  onSendToLayoutAnnotation?: (imageUrl: string) => void,
  onSendToLibrary?: (imageUrl: string) => void,
  onImageSelect?: (imageUrl: string) => void
) {
  const { toast } = useToast()
  const {
    images,
    removeImage,
    setFullscreenImage,
    fullscreenImage,
    getTotalImages,
    getTotalCreditsUsed,
    getUniqueChains,
    updateImageReference
  } = useUnifiedGalleryStore()

  // State
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [filters, setFilters] = useState<GalleryFilters>({
    searchQuery: '',
    currentPage: 1,
    viewMode: 'grid'
  })

  const IMAGES_PER_PAGE = 12

  // Get chain data
  const chains: ChainData[] = useMemo(() => getUniqueChains(), [getUniqueChains])

  // Filter and pagination logic
  const { filteredImages, paginatedImages, totalPages, filteredChains } = useMemo(() => {
    if (filters.viewMode === 'chains') {
      // Chain view logic
      const filtered = filters.searchQuery.trim() === ''
        ? chains
        : chains.filter((chain: ChainData) =>
            chain.images.some(image =>
              image.prompt.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
              image.chain?.stepPrompt.toLowerCase().includes(filters.searchQuery.toLowerCase())
            )
          )

      return {
        filteredImages: [],
        paginatedImages: [],
        totalPages: 1,
        filteredChains: filtered
      }
    } else {
      // Grid view logic
      const filtered = filters.searchQuery.trim() === ''
        ? images
        : images.filter((image: GalleryImage) =>
            image.prompt.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
            image.model?.toLowerCase().includes(filters.searchQuery.toLowerCase())
          )

      const total = Math.ceil(filtered.length / IMAGES_PER_PAGE)
      const startIndex = (filters.currentPage - 1) * IMAGES_PER_PAGE
      const endIndex = startIndex + IMAGES_PER_PAGE
      const paginated = filtered.slice(startIndex, endIndex)

      return {
        filteredImages: filtered,
        paginatedImages: paginated,
        totalPages: total,
        filteredChains: []
      }
    }
  }, [images, chains, filters])

  // Handlers
  const handleImageSelect = useCallback((imageUrl: string) => {
    if (onImageSelect) {
      onImageSelect(imageUrl)
    } else {
      setSelectedImages(prev =>
        prev.includes(imageUrl)
          ? prev.filter(url => url !== imageUrl)
          : [...prev, imageUrl]
      )
    }
  }, [onImageSelect])

  const handleClearSelection = () => {
    setSelectedImages([])
  }

  const handleDeleteSelected = () => {
    selectedImages.forEach(url => removeImage(url))
    setSelectedImages([])
    toast({
      title: "Images Deleted",
      description: `${selectedImages.length} images removed from gallery`
    })
  }

  const handleCopyImage = async (url: string) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      // Try to write image directly to clipboard
      if (navigator.clipboard && (navigator.clipboard as { write: (items: ClipboardItem[]) => Promise<void> }).write) {
        await (navigator.clipboard as { write: (items: ClipboardItem[]) => Promise<void> }).write([
          new ClipboardItem({ [blob.type]: blob })
        ])
        toast({
          title: "Copied",
          description: "Image copied to clipboard"
        })
      } else {
        // fallback: copy URL
        await navigator.clipboard.writeText(url)
        toast({
          title: "Copied URL",
          description: "Image URL copied to clipboard"
        })
      }
    } catch (error) {
      console.error("Copy failed", error)
      toast({
        title: "Copy Failed",
        description: "Unable to copy prompt to clipboard",
        variant: "destructive"
      })
    }
  }

  const handleDownloadImage = async (url: string) => {
    try {
      // Fetch the image as a blob
      const response = await fetch(url, { mode: "cors" })
      const blob = await response.blob()

      // Create a local object URL for the blob
      const objectUrl = URL.createObjectURL(blob)

      // Create a hidden <a> tag and click it
      const a = document.createElement("a")
      a.href = objectUrl
      a.download = `image_${Date.now()}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      // Cleanup the object URL
      URL.revokeObjectURL(objectUrl)

      toast({
        title: "Download started",
        description: "Your image is downloading"
      })
    } catch (err) {
      console.error("Download failed", err)
      toast({
        title: "Download failed",
        description: "Could not download image",
        variant: "destructive"
      })
    }
  }

  const handleDeleteImage = (imageUrl: string) => {
    removeImage(imageUrl)
    setSelectedImages(prev => prev.filter(url => url !== imageUrl))
    toast({
      title: "Image Deleted",
      description: "Image removed from gallery"
    })
  }

  const handleSendTo = (imageUrl: string, target: string) => {
    if ((target === 'reference' || target === 'shot-creator') && onUseAsReference) {
      onUseAsReference(imageUrl)
      return
    } else if (target === 'shot-animator' && onSendToShotAnimator) {
      onSendToShotAnimator(imageUrl)
      return
    } else if (target === 'layout-annotation' && onSendToLayoutAnnotation) {
      onSendToLayoutAnnotation(imageUrl)
      return
    } else if (onSendToTab) {
      onSendToTab(imageUrl, target)
    } else if (target === 'library' && onSendToLibrary) {
      onSendToLibrary(imageUrl)
    }

    toast({
      title: "Image Sent",
      description: `Image sent to ${target}`
    })
  }

  const handleSearchChange = (query: string) => {
    setFilters(prev => ({ ...prev, searchQuery: query, currentPage: 1 }))
  }

  const handleViewModeChange = (mode: ViewMode) => {
    setFilters(prev => ({ ...prev, viewMode: mode, currentPage: 1 }))
  }

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, currentPage: page }))
  }

  return {
    // Data
    images,
    filteredImages,
    paginatedImages,
    chains: filteredChains,
    totalPages,
    selectedImages,
    filters,
    fullscreenImage,

    // Stats
    totalImages: getTotalImages(),
    totalCredits: getTotalCreditsUsed(),

    // Handlers
    handleImageSelect,
    handleClearSelection,
    handleDeleteSelected,
    handleCopyImage,
    handleDownloadImage,
    handleDeleteImage,
    handleSendTo,
    handleSearchChange,
    handleViewModeChange,
    handlePageChange,
    setFullscreenImage,
    updateImageReference
  }
}