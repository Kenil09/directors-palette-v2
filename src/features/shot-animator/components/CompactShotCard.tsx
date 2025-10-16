'use client'

import React from 'react'
import Image from 'next/image'
import { Image as ImageIcon, Film, Trash2, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { ShotAnimationConfig } from '../types'
import { Textarea } from "@/components/ui/textarea"
import { CompactVideoCard } from './CompactVideoCard'
import { VideoGalleryService } from '../services/gallery.service'
import { toast } from '@/hooks/use-toast'

interface CompactShotCardProps {
  config: ShotAnimationConfig
  maxReferenceImages: number
  supportsLastFrame: boolean
  onUpdate: (config: ShotAnimationConfig) => void
  onDelete: () => void
  onManageReferences: () => void
  onManageLastFrame: () => void
  onRetryVideo?: (galleryId: string) => void
}

export function CompactShotCard({
  config,
  maxReferenceImages,
  supportsLastFrame,
  onUpdate,
  onDelete,
  onManageReferences,
  onManageLastFrame,
  onRetryVideo
}: CompactShotCardProps) {
  const handleToggleSelect = () => {
    onUpdate({ ...config, includeInBatch: !config.includeInBatch })
  }

  const handleDeleteGeneratedVideo = async (galleryId: string) => {
    try {
      // Delete from Supabase
      const result = await VideoGalleryService.deleteVideo(galleryId)

      if (result.success) {
        // Update local state to remove the video
        onUpdate({
          ...config,
          generatedVideos: config.generatedVideos.filter(v => v.galleryId !== galleryId)
        })
        toast({
          title: 'Video Deleted',
          description: 'The video has been successfully deleted.',
        })
      } else {
        toast({
          title: 'Delete Failed',
          description: result.error || 'Failed to delete video. Please try again.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error deleting video:', error)
      toast({
        title: 'Delete Error',
        description: 'An unexpected error occurred while deleting the video.',
        variant: 'destructive',
      })
    }
  }

  return (
    <Card
      className={`h-full flex flex-col bg-slate-800/50 border-2 transition-all hover:border-slate-600 ${config.includeInBatch ? 'border-purple-500' : 'border-slate-700'
        }`}
    >
      {/* Image with Checkbox Overlay */}
      <div className="relative aspect-square bg-slate-900 group">
        <Image
          src={config.imageUrl}
          alt={config.imageName}
          width={400}
          height={400}
          className="object-cover"
        />

        {/* Selection Overlay */}
        {config.includeInBatch && (
          <div className="absolute inset-0 bg-purple-500/10" />
        )}

        <div className="absolute top-2 left-2 z-10">
          <Checkbox
            checked={config.includeInBatch}
            onCheckedChange={handleToggleSelect}
            className="bg-white/90 border-white"
          />
        </div>
        {/* Video Status Badge - Top Right */}
        {config.generatedVideos && config.generatedVideos.length > 0 && (
          <div className="absolute top-2 right-2 z-10">
            {config.generatedVideos.some(v => v.status === 'processing') && (
              <Badge className="bg-purple-600 text-white text-xs flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Processing
              </Badge>
            )}
            {config.generatedVideos.every(v => v.status === 'completed') && (
              <Badge className="bg-green-600 text-white text-xs">
                {config.generatedVideos.length} Video{config.generatedVideos.length > 1 ? 's' : ''}
              </Badge>
            )}
            {config.generatedVideos.some(v => v.status === 'failed') && (
              <Badge className="bg-red-600 text-white text-xs">
                Failed
              </Badge>
            )}
          </div>
        )}

        {/* Delete Button - Bottom Right (only show on hover) */}
        <div className="absolute bottom-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="icon"
            variant="ghost"
            onClick={onDelete}
            className="h-7 w-7 bg-red-500/80 hover:bg-red-600 text-white"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Card Content */}
      <div className="px-3 space-y-2">
        <p className="text-xs text-slate-300 truncate font-medium">
          {config.imageName}
        </p>
        {/* Filename */}
        <Textarea
          value={config.prompt}
          onChange={(e) => onUpdate({ ...config, prompt: e.target.value })}
          placeholder="Describe the animation..."
          className="bg-slate-700 text-white text-xs min-h-[100px] resize-none"
        />
        {/* Action Buttons */}
        <div className="flex w-full items-center gap-2">
          {/* Reference Images Button */}
          <div className="w-1/2">
            {maxReferenceImages > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onManageReferences}
                className="h-7 px-2 w-full text-xs bg-slate-700/50 hover:bg-slate-700 text-purple-400 border border-purple-500/30"
              >
                <ImageIcon className="w-3 h-3 mr-1" />
                Refs
                {config.referenceImages.length > 0 && (
                  <Badge className="ml-1 h-4 px-1 text-xs bg-purple-600">
                    {config.referenceImages.length}
                  </Badge>
                )}
              </Button>
            )}
          </div>

          {/* Last Frame Button */}
          <div className="w-1/2">
            {supportsLastFrame && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onManageLastFrame}
                className="h-7 px-2 w-full text-xs bg-slate-700/50 hover:bg-slate-700 text-purple-400 border border-purple-500/30"
              >
                <Film className="w-3 h-3" />
                Last Frame
                {config.lastFrameImage && (
                  <Badge className="ml-1 h-4 px-1 text-xs bg-purple-600">1</Badge>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Generated Videos */}
        {config.generatedVideos && config.generatedVideos.length > 0 && (
          <div className="mt-2">
            <CompactVideoCard
              videos={config.generatedVideos}
              onDeleteVideo={handleDeleteGeneratedVideo}
              onRetryVideo={onRetryVideo}
            />
          </div>
        )}
      </div>
    </Card>
  )
}
