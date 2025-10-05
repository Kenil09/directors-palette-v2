'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { Upload, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

interface LastFrameModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (imageUrl?: string) => void
  initialImage?: string
  imageName: string
}

export function LastFrameModal({
  isOpen,
  onClose,
  onSave,
  initialImage,
  imageName
}: LastFrameModalProps) {
  const [image, setImage] = useState<string | undefined>(initialImage)

  useEffect(() => {
    setImage(initialImage)
  }, [initialImage, isOpen])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // TODO: Implement actual file upload
    const imageUrl = URL.createObjectURL(file)
    setImage(imageUrl)
    e.target.value = ''
  }

  const handleRemove = () => {
    setImage(undefined)
  }

  const handleSave = () => {
    onSave(image)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle>Last Frame Image</DialogTitle>
          <DialogDescription className="text-slate-400">
            {imageName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-white">Last Frame Image (Optional)</Label>
            <p className="text-sm text-slate-400">
              Specify the ending frame for the animation
            </p>
          </div>

          {/* Image Preview */}
          <div className="flex justify-center">
            {image ? (
              <div className="relative w-64 h-64">
                <Image
                  src={image}
                  alt="Last frame"
                  fill
                  className="object-cover rounded border border-slate-600"
                />
                <button
                  onClick={handleRemove}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="w-64 h-64 border-2 border-dashed border-slate-600 rounded flex flex-col items-center justify-center cursor-pointer hover:border-slate-500 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Upload className="w-12 h-12 text-slate-500 mb-4" />
                <span className="text-sm text-slate-400">Upload Last Frame</span>
              </label>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="bg-slate-800 border-slate-600"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Save Last Frame
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
