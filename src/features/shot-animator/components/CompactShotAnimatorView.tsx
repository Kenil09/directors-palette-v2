'use client'

import React, { useState } from 'react'
import { Upload, ImageIcon, Search, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CompactShotCard } from './CompactShotCard'
import { PromptEditModal } from './PromptEditModal'
import { ReferenceImagesModal } from './ReferenceImagesModal'
import { LastFrameModal } from './LastFrameModal'
import { ModelSettingsModal } from './ModelSettingsModal'
import { GallerySelectModal } from './GallerySelectModal'
import { AnimatorUnifiedGallery } from './AnimatorUnifiedGallery'
import {
  AnimationModel,
  ShotAnimationConfig,
  AnimatorSettings,
} from '../types'
import {
  ANIMATION_MODELS,
  DEFAULT_MODEL_SETTINGS,
} from '../config/models.config'

// Mock data
const MOCK_GALLERY_IMAGES = [
  { id: "1", url: "https://picsum.photos/seed/shot1/400/400", name: "kitchen_scene.png" },
  { id: "2", url: "https://picsum.photos/seed/shot2/400/400", name: "bedroom_dusk.png" },
  { id: "3", url: "https://picsum.photos/seed/shot3/400/400", name: "hallway_lights.png" },
  { id: "4", url: "https://picsum.photos/seed/shot4/400/400", name: "garden_morning.png" },
  { id: "5", url: "https://picsum.photos/seed/shot5/400/400", name: "pool_sunset.png" },
  { id: "6", url: "https://picsum.photos/seed/shot6/400/400", name: "living_room.png" },
  { id: "7", url: "https://picsum.photos/seed/shot7/400/400", name: "balcony_night.png" },
  { id: "8", url: "https://picsum.photos/seed/shot8/400/400", name: "street_view.png" },
]

const MOCK_SHOT_CONFIGS: ShotAnimationConfig[] = [
  {
    id: "demo-1",
    imageUrl: "https://picsum.photos/seed/demo1/400/400",
    imageName: "opening_scene.png",
    prompt: "A cinematic slow pan across a modern kitchen at golden hour",
    referenceImages: ["https://picsum.photos/seed/ref1/200/200", "https://picsum.photos/seed/ref2/200/200"],
    lastFrameImage: "https://picsum.photos/seed/last1/200/200",
    includeInBatch: true,
  },
  {
    id: "demo-2",
    imageUrl: "https://picsum.photos/seed/demo2/400/400",
    imageName: "bedroom_twilight.png",
    prompt: "Gentle dolly in towards a cozy bedroom window as daylight fades",
    referenceImages: [],
    includeInBatch: true,
  },
  {
    id: "demo-3",
    imageUrl: "https://picsum.photos/seed/demo3/400/400",
    imageName: "hallway_reveal.png",
    prompt: "Mysterious tracking shot down a dimly lit hallway",
    referenceImages: ["https://picsum.photos/seed/ref3/200/200"],
    includeInBatch: false,
  },
  {
    id: "demo-4",
    imageUrl: "https://picsum.photos/seed/demo4/400/400",
    imageName: "garden_vista.png",
    prompt: "",
    referenceImages: [],
    includeInBatch: true,
  },
  {
    id: "demo-5",
    imageUrl: "https://picsum.photos/seed/demo5/400/400",
    imageName: "pool_reflection.png",
    prompt: "Calm water ripples catching sunset light",
    referenceImages: [],
    includeInBatch: true,
  },
  {
    id: "demo-6",
    imageUrl: "https://picsum.photos/seed/demo6/400/400",
    imageName: "balcony_cityscape.png",
    prompt: "",
    referenceImages: [],
    includeInBatch: false,
  },
]

// Mock generated videos for the unified gallery
const MOCK_GENERATED_VIDEOS = [
  {
    id: "video-1",
    videoUrl: "https://example.com/video1.mp4",
    thumbnailUrl: "https://picsum.photos/seed/video1/400/300",
    shotName: "garden_morning.png",
    model: "Seedance Lite",
    createdAt: new Date(Date.now() - 3600000),
    status: "completed" as const,
  },
  {
    id: "video-2",
    videoUrl: "https://example.com/video2.mp4",
    thumbnailUrl: "https://picsum.photos/seed/video2/400/300",
    shotName: "pool_sunset.png",
    model: "Seedance Pro",
    createdAt: new Date(Date.now() - 7200000),
    status: "completed" as const,
  },
  {
    id: "video-3",
    videoUrl: "https://example.com/video3.mp4",
    thumbnailUrl: "https://picsum.photos/seed/video3/400/300",
    shotName: "balcony_cityscape.png",
    model: "Seedance Lite",
    createdAt: new Date(Date.now() - 1800000),
    status: "completed" as const,
  },
  {
    id: "video-4",
    videoUrl: "https://example.com/video4.mp4",
    thumbnailUrl: "https://picsum.photos/seed/video4/400/300",
    shotName: "street_view.png",
    model: "Seedance Pro",
    createdAt: new Date(Date.now() - 900000),
    status: "completed" as const,
  },
]

export function CompactShotAnimatorView() {
  const [selectedModel, setSelectedModel] = useState<AnimationModel>("seedance-lite")
  const [shotConfigs, setShotConfigs] = useState<ShotAnimationConfig[]>(MOCK_SHOT_CONFIGS)
  const [modelSettings, setModelSettings] = useState<AnimatorSettings>(DEFAULT_MODEL_SETTINGS)
  const [generatedVideos, setGeneratedVideos] = useState(MOCK_GENERATED_VIDEOS)

  // Modals
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false)
  const [promptEditState, setPromptEditState] = useState<{ isOpen: boolean; configId?: string }>({ isOpen: false })
  const [refEditState, setRefEditState] = useState<{ isOpen: boolean; configId?: string }>({ isOpen: false })
  const [lastFrameEditState, setLastFrameEditState] = useState<{ isOpen: boolean; configId?: string }>({ isOpen: false })

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [showOnlySelected, setShowOnlySelected] = useState(false)
  const [sortBy, setSortBy] = useState('date')

  const currentModelConfig = ANIMATION_MODELS[selectedModel]

  // Filtered shots
  const filteredShots = shotConfigs
    .filter((shot) => {
      if (showOnlySelected && !shot.includeInBatch) return false
      if (searchQuery && !shot.imageName.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })

  const selectedCount = shotConfigs.filter((s) => s.includeInBatch).length

  // Handlers
  const handleGallerySelect = (images: typeof MOCK_GALLERY_IMAGES) => {
    const newConfigs: ShotAnimationConfig[] = images.map((img) => ({
      id: `shot-${Date.now()}-${Math.random()}`,
      imageUrl: img.url,
      imageName: img.name,
      prompt: "",
      referenceImages: [],
      includeInBatch: true,
    }))
    setShotConfigs((prev) => [...prev, ...newConfigs])
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const newConfigs: ShotAnimationConfig[] = Array.from(files).map((file) => ({
      id: `shot-${Date.now()}-${Math.random()}`,
      imageUrl: URL.createObjectURL(file),
      imageName: file.name,
      prompt: "",
      referenceImages: [],
      includeInBatch: true,
    }))

    setShotConfigs((prev) => [...prev, ...newConfigs])
    e.target.value = ""
  }

  const handleUpdateShotConfig = (id: string, updates: ShotAnimationConfig) => {
    setShotConfigs((prev) => prev.map((config) => (config.id === id ? updates : config)))
  }

  const handleSavePrompt = (configId: string, prompt: string) => {
    setShotConfigs((prev) =>
      prev.map((config) => (config.id === configId ? { ...config, prompt } : config))
    )
  }

  const handleSaveReferences = (configId: string, images: string[]) => {
    setShotConfigs((prev) =>
      prev.map((config) => (config.id === configId ? { ...config, referenceImages: images } : config))
    )
  }

  const handleSaveLastFrame = (configId: string, image?: string) => {
    setShotConfigs((prev) =>
      prev.map((config) => (config.id === configId ? { ...config, lastFrameImage: image } : config))
    )
  }

  const handleDeselectAll = () => {
    setShotConfigs((prev) => prev.map((config) => ({ ...config, includeInBatch: false })))
  }

  const handleDeleteShot = (id: string) => {
    setShotConfigs((prev) => prev.filter((config) => config.id !== id))
  }

  const handleGenerateAll = () => {
    const selectedShots = shotConfigs.filter((s) => s.includeInBatch)
    // TODO: Implement actual video generation
    const newVideos = selectedShots.map((shot) => ({
      id: `video-${Date.now()}-${Math.random()}`,
      videoUrl: "",
      thumbnailUrl: shot.imageUrl,
      shotName: shot.imageName,
      model: selectedModel === "seedance-lite" ? "Seedance Lite" : "Seedance Pro",
      createdAt: new Date(),
      status: "completed" as const,
    }))
    setGeneratedVideos((prev) => [...newVideos, ...prev])
  }

  const handleDeleteVideo = (id: string) => {
    setGeneratedVideos((prev) => prev.filter((v) => v.id !== id))
  }

  const handleDownloadVideo = (videoUrl: string) => {
    // TODO: Implement actual download
    console.log("Downloading video:", videoUrl)
  }

  const currentPromptEditConfig = shotConfigs.find((c) => c.id === promptEditState.configId)
  const currentRefEditConfig = shotConfigs.find((c) => c.id === refEditState.configId)
  const currentLastFrameConfig = shotConfigs.find((c) => c.id === lastFrameEditState.configId)

  return (
    <div className="w-full h-full flex flex-col bg-slate-950">
      {/* Top Toolbar */}
      <div className="border-b border-slate-700 bg-slate-900/50">
        {/* Model Selection & Settings */}
        <div className="px-4 py-2 flex items-center justify-between gap-4">
          <RadioGroup
            value={selectedModel}
            onValueChange={(value) => setSelectedModel(value as AnimationModel)}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="seedance-lite" id="model-lite" />
              <Label htmlFor="model-lite" className="cursor-pointer text-white text-sm">
                Seedance Lite
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="seedance-pro" id="model-pro" />
              <Label htmlFor="model-pro" className="cursor-pointer text-white text-sm">
                Seedance Pro
              </Label>
            </div>
          </RadioGroup>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                placeholder="Search images..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 w-48 bg-slate-800 border-slate-600 text-white text-sm"
              />
            </div>

            {/* Upload */}
            <label htmlFor="file-upload-toolbar">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 border-slate-600 text-white hover:bg-slate-800"
                onClick={() => document.getElementById("file-upload-toolbar")?.click()}
              >
                <Upload className="w-4 h-4 mr-1" />
                Upload
              </Button>
            </label>
            <input
              id="file-upload-toolbar"
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Gallery */}
            <Button
              onClick={() => setIsGalleryModalOpen(true)}
              size="sm"
              className="h-8 bg-slate-700 hover:bg-slate-600"
            >
              <ImageIcon className="w-4 h-4 mr-1" />
              Gallery
            </Button>

            {/* Settings */}
            <ModelSettingsModal settings={modelSettings} onSave={setModelSettings} />
          </div>
        </div>

        {/* Selection Controls */}
        <div className="px-4 py-2 flex items-center justify-between border-t border-slate-700/50">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeselectAll}
              className="h-7 text-xs text-slate-400 hover:text-white"
            >
              Deselect All
            </Button>
            <div className="flex items-center gap-2">
              <Checkbox
                id="show-selected"
                checked={showOnlySelected}
                onCheckedChange={(checked) => setShowOnlySelected(checked as boolean)}
              />
              <Label htmlFor="show-selected" className="text-xs text-slate-400 cursor-pointer">
                Show only selected
              </Label>
            </div>
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-32 h-7 text-xs bg-slate-800 border-slate-600">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Sort: Date</SelectItem>
              <SelectItem value="name">Sort: Name</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="flex-1 overflow-hidden grid grid-cols-[1fr_400px]">
        {/* Left: Shots Grid */}
        <div className="overflow-hidden">
          <ScrollArea className="h-full">
            {filteredShots.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-96 text-slate-500">
                <ImageIcon className="w-16 h-16 mb-4" />
                <p>No images to display</p>
                <p className="text-sm mt-2">Upload images or add from gallery to get started</p>
              </div>
            ) : (
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-24">
                {filteredShots.map((config) => (
                  <CompactShotCard
                    key={config.id}
                    config={config}
                    maxReferenceImages={currentModelConfig.maxReferenceImages}
                    supportsLastFrame={currentModelConfig.supportsLastFrame}
                    onUpdate={(updates) => handleUpdateShotConfig(config.id, updates)}
                    onDelete={() => handleDeleteShot(config.id)}
                    onEditPrompt={() => setPromptEditState({ isOpen: true, configId: config.id })}
                    onManageReferences={() => setRefEditState({ isOpen: true, configId: config.id })}
                    onManageLastFrame={() => setLastFrameEditState({ isOpen: true, configId: config.id })}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Right: Unified Gallery */}
        <AnimatorUnifiedGallery
          videos={generatedVideos}
          onDelete={handleDeleteVideo}
          onDownload={handleDownloadVideo}
        />
      </div>

      {/* Bottom Generate Bar */}
      {selectedCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-300 p-4 z-50">
          <div className="max-w-7xl mx-auto flex items-center justify-center">
            <Button
              onClick={handleGenerateAll}
              size="lg"
              className="bg-purple-600 hover:bg-purple-700 text-white px-8"
            >
              <Play className="w-5 h-5 mr-2" />
              Generate Videos ({selectedCount} selected) - 75 credits
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      <GallerySelectModal
        isOpen={isGalleryModalOpen}
        onClose={() => setIsGalleryModalOpen(false)}
        onSelect={handleGallerySelect}
        galleryImages={MOCK_GALLERY_IMAGES}
      />

      {currentPromptEditConfig && (
        <PromptEditModal
          isOpen={promptEditState.isOpen}
          onClose={() => setPromptEditState({ isOpen: false })}
          onSave={(prompt) => handleSavePrompt(currentPromptEditConfig.id, prompt)}
          initialPrompt={currentPromptEditConfig.prompt}
          imageName={currentPromptEditConfig.imageName}
        />
      )}

      {currentRefEditConfig && (
        <ReferenceImagesModal
          isOpen={refEditState.isOpen}
          onClose={() => setRefEditState({ isOpen: false })}
          onSave={(images) => handleSaveReferences(currentRefEditConfig.id, images)}
          initialImages={currentRefEditConfig.referenceImages}
          maxImages={currentModelConfig.maxReferenceImages}
          imageName={currentRefEditConfig.imageName}
        />
      )}

      {currentLastFrameConfig && (
        <LastFrameModal
          isOpen={lastFrameEditState.isOpen}
          onClose={() => setLastFrameEditState({ isOpen: false })}
          onSave={(image) => handleSaveLastFrame(currentLastFrameConfig.id, image)}
          initialImage={currentLastFrameConfig.lastFrameImage}
          imageName={currentLastFrameConfig.imageName}
        />
      )}
    </div>
  )
}
