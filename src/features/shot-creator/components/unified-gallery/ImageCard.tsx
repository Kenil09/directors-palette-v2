'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  MoreVertical,
  Copy,
  Download,
  Trash2,
  Tag,
  Library,
  FileText,
  Film,
  Layout,
  Sparkles
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { GalleryImage } from "@/features/shot-creator/components/unified-gallery/ChainView"
import { useGalleryLogic } from "@/features/shot-creator/hooks/useGalleryLogic"
import Image from "next/image"

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

// Model icon and color mapping based on model-config.ts
function getModelIcon(model?: string): string {
  switch (model) {
    case 'nano-banana': return '🍌'
    case 'seedream-4': return '🌱'
    case 'gen4-image': return '⚡'
    case 'gen4-image-turbo': return '💨'
    case 'qwen-image': return '🎨'
    case 'qwen-image-edit': return '✏️'
    default: return '🍌' // Default to nano-banana icon
  }
}

// function getModelBadgeColor(model?: string): string {
//   switch (model) {
//     case 'nano-banana': return 'bg-yellow-600'
//     case 'seedream-4': return 'bg-green-600'
//     case 'gen4-image': return 'bg-blue-600'
//     case 'gen4-image-turbo': return 'bg-purple-600'
//     case 'qwen-image': return 'bg-orange-600'
//     case 'qwen-image-edit': return 'bg-indigo-600'
//     default: return 'bg-yellow-600' // Default to nano-banana color
//   }
// }

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
  const { handleCopyImage } = useGalleryLogic()
  const { toast } = useToast()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const handleCopyPrompt = () => {
    if (image.prompt) {
      navigator.clipboard.writeText(image.prompt)
      toast({
        title: "Prompt Copied",
        description: "The prompt has been copied to your clipboard"
      })
    }
  }


  return (
    <div className="relative group rounded-lg overflow-hidden bg-slate-800 border border-slate-700 transition-all hover:border-purple-600/50">
      {/* Main image - show in native aspect ratio */}
      <Image
        src={image.url}
        alt={image.prompt?.slice(0, 50) || 'Generated image'}
        width={250}
        height={250}
        className="w-full h-auto cursor-zoom-in"
        onClick={onZoom}
      />

      {/* Model icon - transparent background */}
      <div className="absolute top-2 left-2 pointer-events-none text-sm drop-shadow-lg">
        {getModelIcon(image.model)}
      </div>

      {/* Reference badge if exists */}
      {image.reference && (
        <div className="absolute top-2 right-2 pointer-events-none">
          <Badge className="bg-green-600 text-white px-2 py-1 text-xs">
            <Tag className="w-3 h-3 mr-1" />
            {image.reference}
          </Badge>
        </div>
      )}

      {/* Action menu button - always visible in bottom right */}
      {showActions && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="secondary"
                className="h-6 w-6 p-0 bg-slate-700/90 hover:bg-slate-600 border-slate-600"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-3 w-3 text-white" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-slate-800 border-slate-700 text-white" align="end">
              <DropdownMenuItem
                onClick={handleCopyPrompt}
                className="hover:bg-slate-700 cursor-pointer"
              >
                <FileText className="mr-2 h-4 w-4" />
                Copy Prompt
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleCopyImage(image.url)}
                className="hover:bg-slate-700 cursor-pointer"
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy Image
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onDownload}
                className="hover:bg-slate-700 cursor-pointer"
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-slate-700" />

              {onSetReference && (
                <DropdownMenuItem
                  onClick={onSetReference}
                  className="hover:bg-slate-700 cursor-pointer"
                >
                  <Tag className="mr-2 h-4 w-4" />
                  Set Reference
                </DropdownMenuItem>
              )}

              {onSendTo && (
                <>
                  <DropdownMenuItem
                    onClick={() => onSendTo('shot-creator')}
                    className="hover:bg-slate-700 cursor-pointer"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Send to Shot Creator
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onSendTo('shot-animator')}
                    className="hover:bg-slate-700 cursor-pointer"
                  >
                    <Film className="mr-2 h-4 w-4" />
                    Send to Shot Animator
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onSendTo('layout-annotation')}
                    className="hover:bg-slate-700 cursor-pointer"
                  >
                    <Layout className="mr-2 h-4 w-4" />
                    Send to Layout
                  </DropdownMenuItem>
                </>
              )}

              {onAddToLibrary && (
                <DropdownMenuItem
                  onClick={onAddToLibrary}
                  className="hover:bg-slate-700 cursor-pointer"
                >
                  <Library className="mr-2 h-4 w-4" />
                  Add to Library
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator className="bg-slate-700" />

              <DropdownMenuItem
                onClick={onDelete}
                className="hover:bg-red-700 cursor-pointer text-red-400"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Image
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Hover tooltip with prompt */}
      <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <p className="text-xs text-white truncate">
          {image.prompt || 'No prompt available'}
        </p>
      </div>
    </div>
  )
}