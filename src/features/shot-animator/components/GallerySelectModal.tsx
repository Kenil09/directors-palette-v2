'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { ImageIcon, CheckCircle2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'

interface GalleryImage {
  id: string
  url: string
  name: string
  createdAt: Date
}

interface GallerySelectModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (images: GalleryImage[]) => void
  galleryImages: GalleryImage[]
}

export function GallerySelectModal({
  isOpen,
  onClose,
  onSelect,
  galleryImages
}: GallerySelectModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const handleToggleImage = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    if (selectedIds.size === galleryImages.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(galleryImages.map(img => img.id)))
    }
  }

  const handleConfirm = () => {
    const selected = galleryImages.filter(img => selectedIds.has(img.id))
    onSelect(selected)
    setSelectedIds(new Set())
    onClose()
  }

  const handleCancel = () => {
    setSelectedIds(new Set())
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle>Add from Gallery</DialogTitle>
          <DialogDescription className="text-slate-400">
            Select images from your gallery to animate
          </DialogDescription>
        </DialogHeader>

        {/* Selection Info */}
        <div className="flex items-center justify-between py-2 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Checkbox
              id="select-all"
              checked={selectedIds.size === galleryImages.length && galleryImages.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <label htmlFor="select-all" className="text-sm text-slate-300 cursor-pointer">
              Select All
            </label>
          </div>
          <Badge variant="outline" className="border-purple-600 text-purple-400">
            {selectedIds.size} selected
          </Badge>
        </div>

        {/* Gallery Grid */}
        <ScrollArea className="h-[500px] pr-4">
          {galleryImages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
              <ImageIcon className="w-16 h-16 mb-4" />
              <p>No images in gallery</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {galleryImages.map((image) => {
                const isSelected = selectedIds.has(image.id)
                return (
                  <div
                    key={image.id}
                    onClick={() => handleToggleImage(image.id)}
                    className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                      isSelected
                        ? 'border-purple-500 ring-2 ring-purple-500/30'
                        : 'border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    {/* Image */}
                    <div className="relative aspect-square bg-slate-800">
                      <Image
                        src={image.url}
                        alt={image.name}
                        fill
                        className="object-cover"
                      />

                      {/* Overlay */}
                      <div className={`absolute inset-0 transition-opacity ${
                        isSelected ? 'bg-purple-500/20' : 'bg-black/0 group-hover:bg-black/20'
                      }`} />

                      {/* Selection Indicator */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 bg-purple-500 rounded-full p-1">
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        </div>
                      )}

                      {/* Checkbox */}
                      <div className="absolute top-2 left-2">
                        <Checkbox
                          checked={isSelected}
                          className="bg-white/90"
                        />
                      </div>
                    </div>

                    {/* Image Info */}
                    <div className="p-2 bg-slate-800/90">
                      <p className="text-xs text-slate-300 truncate">{image.name}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            className="bg-slate-800 border-slate-600"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedIds.size === 0}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700"
          >
            Add {selectedIds.size > 0 ? `${selectedIds.size} ` : ''}
            {selectedIds.size === 1 ? 'Image' : 'Images'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
