'use client'

import { useState } from 'react'
import Image from "next/image"
import type { GalleryImage } from "../../types"
import { useImageActions } from "../../hooks/useImageActions"
import { ImageActionMenu } from "./ImageActionMenu"
import { ModelBadge } from "./ModelBadge"
import { ReferenceBadge } from "./ReferenceBadge"
import { PromptTooltip } from "./PromptTooltip"

interface ImageCardProps {
  image: GalleryImage
  isSelected: boolean
  onSelect: () => void
  onZoom: () => void
  onCopy: () => void
  onDownload: () => void
  onDelete: () => void
  onSendTo?: (target: string) => void
  onSetReference?: () => void
  onAddToLibrary?: () => void
  showActions?: boolean
}

/**
 * Image card component for gallery display
 * Displays image with overlays, badges, and action menu
 */
export function ImageCard({
  image,
  onZoom,
  onDownload,
  onDelete,
  onSendTo,
  onSetReference,
  onAddToLibrary,
  showActions = true
}: ImageCardProps) {
  const { handleCopyPrompt, handleCopyImage } = useImageActions()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  return (
    <div className="relative group rounded-lg overflow-hidden bg-slate-800 border border-slate-700 transition-all hover:border-purple-600/50">
      {/* Main image - show in native aspect ratio */}
      <Image
        src={image.url}
        alt={image.prompt?.slice(0, 50) || 'Generated image'}
        width={80}
        height={80}
        className="w-full h-auto cursor-zoom-in"
        onClick={onZoom}
      />

      {/* Model icon badge */}
      <ModelBadge model={image.model} />

      {/* Reference badge if exists */}
      <ReferenceBadge reference={image.reference || ''} />

      {/* Action menu button */}
      {showActions && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <ImageActionMenu
            imageUrl={image.url}
            prompt={image.prompt}
            onCopyPrompt={() => handleCopyPrompt(image.prompt)}
            onCopyImage={() => handleCopyImage(image.url)}
            onDownload={onDownload}
            onDelete={onDelete}
            onSendTo={onSendTo}
            onSetReference={onSetReference}
            onAddToLibrary={onAddToLibrary}
            dropdownOpen={dropdownOpen}
            onDropdownChange={setDropdownOpen}
          />
        </div>
      )}

      {/* Hover tooltip with prompt */}
      <PromptTooltip prompt={image.prompt} />
    </div>
  )
}
