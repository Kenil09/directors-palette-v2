'use client'

import { CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ImageIcon, Search, Trash2 } from 'lucide-react'
import { ViewMode } from "../../hooks/useGalleryLogic"

interface GalleryHeaderProps {
  totalImages: number
  totalCredits: number
  searchQuery: string
  viewMode: ViewMode
  selectedCount: number
  onSearchChange: (query: string) => void
  onViewModeChange: (mode: ViewMode) => void
  onClearSelection: () => void
  onDeleteSelected: () => void
}

export function GalleryHeader({
  totalImages,
  totalCredits,
  searchQuery,
  viewMode,
  selectedCount,
  onSearchChange,
  onViewModeChange,
  onClearSelection,
  onDeleteSelected
}: GalleryHeaderProps) {
  return (
    <CardHeader className="pb-4">
      <div className="flex flex-col gap-3">
        {/* Top row with title and stats */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-blue-400" />
            <CardTitle>Unified Gallery</CardTitle>
            <Badge variant="outline" className="ml-2">
              {totalImages} images
            </Badge>
            <Badge variant="outline" className="ml-1">
              {totalCredits} credits used
            </Badge>
          </div>
        </div>

        {/* Bottom row with search and controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[180px] max-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search prompts..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 w-full h-8"
            />
          </div>

          {/* View Mode Toggle */}
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewModeChange('grid')}
          >
            Grid
          </Button>

          {/* Selection Actions */}
          {selectedCount > 0 && (
            <>
              <Badge className="bg-blue-600">
                {selectedCount} selected
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={onClearSelection}
              >
                Clear
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={onDeleteSelected}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </>
          )}
        </div>
      </div>
    </CardHeader>
  )
}