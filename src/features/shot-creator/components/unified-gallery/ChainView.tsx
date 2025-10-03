'use client'

import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Zap, Calendar, Link } from 'lucide-react'
import { format } from 'date-fns'
import { ImageCard } from "./ImageCard"

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

export interface ImageChain {
  chainId: string
  images: GalleryImage[]
  totalCredits: number
  startTime: number
  endTime: number
}

interface ChainViewProps {
  chains: ImageChain[]
  selectedImages: string[]
  onImageSelect: (imageUrl: string) => void
  onImageZoom: (imageUrl: string) => void
  onImageCopy: (imageUrl: string) => void
  onImageDownload: (imageUrl: string) => void
  onImageDelete: (imageUrl: string) => void
  onSendTo?: (imageUrl: string, target: string) => void
}

export function ChainView({
  chains,
  selectedImages,
  onImageSelect,
  onImageZoom,
  onImageCopy,
  onImageDownload,
  onImageDelete,
  onSendTo
}: ChainViewProps) {
  const formatTimestamp = (timestamp: number) => {
    return format(new Date(timestamp), 'MMM d, h:mm a')
  }

  if (chains.length === 0) {
    return (
      <div className="text-center py-12">
        <Link className="w-12 h-12 mx-auto mb-4 text-slate-600" />
        <p className="text-slate-400">No image chains found</p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-[600px]">
      <div className="space-y-6 p-4">
        {chains.map((chain) => (
          <div
            key={chain.chainId}
            className="border border-slate-700 rounded-lg p-4 bg-slate-900/30"
          >
            {/* Chain Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Link className="w-5 h-5 text-purple-400" />
                <span className="font-medium">Chain {chain.chainId.slice(-8)}</span>
                <Badge variant="outline">
                  {chain.images.length} steps
                </Badge>
                <Badge variant="outline">
                  <Zap className="w-3 h-3 mr-1" />
                  {chain.totalCredits} credits
                </Badge>
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Calendar className="w-3 h-3" />
                {formatTimestamp(chain.startTime)} - {formatTimestamp(chain.endTime)}
              </div>
            </div>

            {/* Chain Images */}
            <div className="grid grid-cols-4 gap-3">
              {chain.images.map((image, index) => (
                <div key={`chain-${chain.chainId}-${index}`} className="relative">
                  {/* Step Number Badge */}
                  <div className="absolute -top-2 -left-2 z-10">
                    <Badge className="bg-purple-600 text-white text-xs">
                      Step {index + 1}
                    </Badge>
                  </div>

                  <ImageCard
                    image={image}
                    isSelected={selectedImages.includes(image.url)}
                    onSelect={() => onImageSelect(image.url)}
                    onZoom={() => onImageZoom(image.url)}
                    onCopy={() => onImageCopy(image.url)}
                    onDownload={() => onImageDownload(image.url)}
                    onDelete={() => onImageDelete(image.url)}
                    onSendTo={onSendTo ? (target) => onSendTo(image.url, target) : undefined}
                    showActions={true}
                  />

                  {/* Chain Connection Line */}
                  {index < chain.images.length - 1 && (
                    <div className="absolute top-1/2 -right-3 w-6 h-0.5 bg-purple-500/50 z-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}