'use client'

import React from 'react'
import Image from 'next/image'
import { Edit3, Image as ImageIcon, Film, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { ShotAnimationConfig } from '../types'

interface CompactShotCardProps {
  config: ShotAnimationConfig
  maxReferenceImages: number
  supportsLastFrame: boolean
  onUpdate: (config: ShotAnimationConfig) => void
  onDelete: () => void
  onEditPrompt: () => void
  onManageReferences: () => void
  onManageLastFrame: () => void
}

export function CompactShotCard({
  config,
  maxReferenceImages,
  supportsLastFrame,
  onUpdate,
  onDelete,
  onEditPrompt,
  onManageReferences,
  onManageLastFrame
}: CompactShotCardProps) {
  const handleToggleSelect = () => {
    onUpdate({ ...config, includeInBatch: !config.includeInBatch })
  }

  return (
    <Card
      className={`bg-slate-800/50 border-2 transition-all hover:border-slate-600 ${
        config.includeInBatch ? 'border-purple-500' : 'border-slate-700'
      }`}
    >
      {/* Image with Checkbox Overlay */}
      <div className="relative aspect-square bg-slate-900 group">
        <Image
          src={config.imageUrl}
          alt={config.imageName}
          fill
          className="object-cover"
        />

        {/* Selection Overlay */}
        {config.includeInBatch && (
          <div className="absolute inset-0 bg-purple-500/10" />
        )}

        {/* Checkbox */}
        <div className="absolute top-2 left-2 z-10">
          <Checkbox
            checked={config.includeInBatch}
            onCheckedChange={handleToggleSelect}
            className="bg-white/90 border-white"
          />
        </div>

        {/* Action Buttons - Top Right */}
        <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Delete Button */}
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
      <div className="p-3 space-y-2">
        {/* Filename */}
        <p className="text-xs text-slate-300 truncate font-medium">
          {config.imageName}
        </p>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {/* Prompt Button */}
          <Button
            size="sm"
            variant="ghost"
            onClick={onEditPrompt}
            className="flex-1 h-7 text-xs bg-slate-700/50 hover:bg-slate-700 text-purple-400 border border-purple-500/30"
          >
            <Edit3 className="w-3 h-3 mr-1" />
            {config.prompt ? 'Edit' : 'Add'} Prompt
          </Button>

          {/* Reference Images Button */}
          {maxReferenceImages > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onManageReferences}
              className="h-7 px-2 text-xs bg-slate-700/50 hover:bg-slate-700 text-purple-400 border border-purple-500/30"
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

          {/* Last Frame Button */}
          {supportsLastFrame && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onManageLastFrame}
              className="h-7 px-2 text-xs bg-slate-700/50 hover:bg-slate-700 text-purple-400 border border-purple-500/30"
            >
              <Film className="w-3 h-3" />
              {config.lastFrameImage && (
                <Badge className="ml-1 h-4 px-1 text-xs bg-purple-600">1</Badge>
              )}
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
