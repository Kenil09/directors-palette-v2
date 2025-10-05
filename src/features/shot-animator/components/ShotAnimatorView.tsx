"use client";

import React, { useState } from "react";
import { Film, Upload, ImageIcon, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShotAnimatorCard } from "./ShotAnimatorCard";
import { ModelSettingsModal } from "./ModelSettingsModal";
import { GenerationQueue } from "./GenerationQueue";
import { GallerySelectModal } from "./GallerySelectModal";
import {
  AnimationModel,
  ShotAnimationConfig,
  AnimatorSettings,
  GenerationQueueItem,
} from "../types";
import {
  ANIMATION_MODELS,
  DEFAULT_MODEL_SETTINGS,
} from "../config/models.config";

// Mock gallery images for demonstration
const MOCK_GALLERY_IMAGES = [
  { id: "1", url: "https://picsum.photos/seed/shot1/400/400", name: "kitchen_scene.png" },
  { id: "2", url: "https://picsum.photos/seed/shot2/400/400", name: "bedroom_dusk.png" },
  { id: "3", url: "https://picsum.photos/seed/shot3/400/400", name: "hallway_lights.png" },
  { id: "4", url: "https://picsum.photos/seed/shot4/400/400", name: "garden_morning.png" },
  { id: "5", url: "https://picsum.photos/seed/shot5/400/400", name: "pool_sunset.png" },
  { id: "6", url: "https://picsum.photos/seed/shot6/400/400", name: "living_room.png" },
  { id: "7", url: "https://picsum.photos/seed/shot7/400/400", name: "balcony_night.png" },
  { id: "8", url: "https://picsum.photos/seed/shot8/400/400", name: "street_view.png" },
];

// Mock shot configurations for demonstration
const MOCK_SHOT_CONFIGS: ShotAnimationConfig[] = [
  {
    id: "demo-1",
    imageUrl: "https://picsum.photos/seed/demo1/400/400",
    imageName: "opening_scene.png",
    prompt: "A cinematic slow pan across a modern kitchen at golden hour, warm sunlight streaming through windows",
    referenceImages: [
      "https://picsum.photos/seed/ref1/200/200",
      "https://picsum.photos/seed/ref2/200/200",
    ],
    lastFrameImage: "https://picsum.photos/seed/last1/200/200",
    includeInBatch: true,
  },
  {
    id: "demo-2",
    imageUrl: "https://picsum.photos/seed/demo2/400/400",
    imageName: "bedroom_twilight.png",
    prompt: "Gentle dolly in towards a cozy bedroom window as daylight fades to evening",
    referenceImages: [],
    includeInBatch: true,
  },
  {
    id: "demo-3",
    imageUrl: "https://picsum.photos/seed/demo3/400/400",
    imageName: "hallway_reveal.png",
    prompt: "Mysterious tracking shot down a dimly lit hallway with flickering lights",
    referenceImages: [
      "https://picsum.photos/seed/ref3/200/200",
    ],
    includeInBatch: false,
  },
];

// Mock queue items for demonstration
const MOCK_QUEUE_ITEMS: GenerationQueueItem[] = [
  {
    id: "queue-1",
    shotConfig: {
      id: "q1",
      imageUrl: "https://picsum.photos/seed/queue1/400/400",
      imageName: "garden_morning.png",
      prompt: "Sunrise timelapse over a lush garden",
      referenceImages: [],
      includeInBatch: true,
    },
    model: "seedance-lite",
    modelSettings: DEFAULT_MODEL_SETTINGS["seedance-lite"],
    status: "processing",
    progress: 65,
    createdAt: new Date(),
  },
  {
    id: "queue-2",
    shotConfig: {
      id: "q2",
      imageUrl: "https://picsum.photos/seed/queue2/400/400",
      imageName: "pool_sunset.png",
      prompt: "Calm water reflections at sunset",
      referenceImages: [],
      includeInBatch: true,
    },
    model: "seedance-pro",
    modelSettings: DEFAULT_MODEL_SETTINGS["seedance-pro"],
    status: "queued",
    createdAt: new Date(),
  },
  {
    id: "queue-3",
    shotConfig: {
      id: "q3",
      imageUrl: "https://picsum.photos/seed/queue3/400/400",
      imageName: "balcony_night.png",
      prompt: "City lights twinkling in the distance from a balcony",
      referenceImages: [],
      includeInBatch: true,
    },
    model: "seedance-lite",
    modelSettings: DEFAULT_MODEL_SETTINGS["seedance-lite"],
    status: "completed",
    videoUrl: "https://example.com/video.mp4",
    createdAt: new Date(),
  },
  {
    id: "queue-4",
    shotConfig: {
      id: "q4",
      imageUrl: "https://picsum.photos/seed/queue4/400/400",
      imageName: "street_view.png",
      prompt: "Busy street with passing cars",
      referenceImages: [],
      includeInBatch: true,
    },
    model: "seedance-lite",
    modelSettings: DEFAULT_MODEL_SETTINGS["seedance-lite"],
    status: "failed",
    error: "Insufficient credits. Please upgrade your plan.",
    createdAt: new Date(),
  },
];

export function ShotAnimatorView() {
  const [selectedModel, setSelectedModel] =
    useState<AnimationModel>("seedance-lite");
  // Initialize with mock data to showcase the UI (change to [] for empty state)
  const [shotConfigs, setShotConfigs] = useState<ShotAnimationConfig[]>(MOCK_SHOT_CONFIGS);
  const [modelSettings, setModelSettings] = useState<AnimatorSettings>(
    DEFAULT_MODEL_SETTINGS
  );
  // Initialize with mock queue items to showcase the UI (change to [] for empty state)
  const [queueItems, setQueueItems] = useState<GenerationQueueItem[]>(MOCK_QUEUE_ITEMS);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);

  const currentModelConfig = ANIMATION_MODELS[selectedModel];
  const selectedCount = shotConfigs.filter((s) => s.includeInBatch).length;

  // Handle gallery selection
  const handleGallerySelect = (images: typeof MOCK_GALLERY_IMAGES) => {
    const newConfigs: ShotAnimationConfig[] = images.map((img) => ({
      id: `shot-${Date.now()}-${Math.random()}`,
      imageUrl: img.url,
      imageName: img.name,
      prompt: "",
      referenceImages: [],
      includeInBatch: true,
    }));
    setShotConfigs((prev) => [...prev, ...newConfigs]);
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // TODO: Implement actual file upload to storage
    const newConfigs: ShotAnimationConfig[] = Array.from(files).map((file) => ({
      id: `shot-${Date.now()}-${Math.random()}`,
      imageUrl: URL.createObjectURL(file),
      imageName: file.name,
      prompt: "",
      referenceImages: [],
      includeInBatch: true,
    }));

    setShotConfigs((prev) => [...prev, ...newConfigs]);
    e.target.value = ""; // Reset input
  };

  const handleUpdateShotConfig = (id: string, updates: ShotAnimationConfig) => {
    setShotConfigs((prev) =>
      prev.map((config) => (config.id === id ? updates : config))
    );
  };

  const handleRemoveShotConfig = (id: string) => {
    setShotConfigs((prev) => prev.filter((config) => config.id !== id));
  };

  const handleGenerateAll = () => {
    const selectedShots = shotConfigs.filter((s) => s.includeInBatch);

    // TODO: Implement actual generation logic
    console.log("Generating videos for:", {
      model: selectedModel,
      modelSettings: modelSettings[selectedModel],
      shots: selectedShots,
    });

    // Create queue items
    const newQueueItems: GenerationQueueItem[] = selectedShots.map((shot) => ({
      id: `queue-${Date.now()}-${Math.random()}`,
      shotConfig: shot,
      model: selectedModel,
      modelSettings: modelSettings[selectedModel],
      status: "queued",
      createdAt: new Date(),
    }));

    setQueueItems((prev) => [...newQueueItems, ...prev]);
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Model Selection */}
      <div className="px-4 py-4 bg-slate-900/30 border-b border-slate-700 flex items-center justify-between gap-3">
        <div className="flex gap-3">
          <Label className="text-white text-sm block">Model</Label>
          <RadioGroup
            value={selectedModel}
            onValueChange={(value) => setSelectedModel(value as AnimationModel)}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="seedance-lite" id="model-lite" />
              <Label htmlFor="model-lite" className="cursor-pointer text-white">
                Seedance Lite
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="seedance-pro" id="model-pro" />
              <Label htmlFor="model-pro" className="cursor-pointer text-white">
                Seedance Pro
              </Label>
            </div>
          </RadioGroup>
        </div>
        <ModelSettingsModal
          settings={modelSettings}
          onSave={setModelSettings}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-6">
            {/* Shots to Animate */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-medium">Shots to Animate</h3>
                <div className="flex gap-2">
                  {/* Upload Images Button */}
                  <label htmlFor="file-upload">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="border-slate-600 text-white hover:bg-slate-800 cursor-pointer"
                      onClick={() => document.getElementById("file-upload")?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Images
                    </Button>
                  </label>
                  <input
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  {/* Add from Gallery Button */}
                  <Button
                    onClick={() => setIsGalleryModalOpen(true)}
                    size="sm"
                    className="bg-slate-700 hover:bg-slate-600"
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Add from Gallery
                  </Button>
                </div>
              </div>

              {shotConfigs.length === 0 ? (
                <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-12 text-center">
                  <Film className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400 mb-4">No shots added yet</p>
                  <p className="text-slate-500 text-sm mb-6">
                    Upload images or select from your gallery to get started
                  </p>
                  <div className="flex gap-3 justify-center">
                    <label htmlFor="file-upload-empty">
                      <Button
                        type="button"
                        variant="outline"
                        className="border-slate-600 text-white hover:bg-slate-800"
                        onClick={() => document.getElementById("file-upload-empty")?.click()}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Images
                      </Button>
                    </label>
                    <input
                      id="file-upload-empty"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      onClick={() => setIsGalleryModalOpen(true)}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Add from Gallery
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {shotConfigs.map((config) => (
                    <ShotAnimatorCard
                      key={config.id}
                      config={config}
                      maxReferenceImages={currentModelConfig.maxReferenceImages}
                      supportsLastFrame={currentModelConfig.supportsLastFrame}
                      onUpdate={(updates) =>
                        handleUpdateShotConfig(config.id, updates)
                      }
                      onRemove={() => handleRemoveShotConfig(config.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Generate Button */}
            {shotConfigs.length > 0 && (
              <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-sm border-t border-slate-700 p-4 -mx-4">
                <Button
                  onClick={handleGenerateAll}
                  disabled={selectedCount === 0}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:text-slate-500"
                  size="lg"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Generate All Selected ({selectedCount})
                </Button>
              </div>
            )}

            {/* Generation Queue */}
            {queueItems.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-slate-700">
                <h3 className="text-white font-medium">Generation Queue</h3>
                <GenerationQueue items={queueItems} />
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Gallery Select Modal */}
      <GallerySelectModal
        isOpen={isGalleryModalOpen}
        onClose={() => setIsGalleryModalOpen(false)}
        onSelect={handleGallerySelect}
        galleryImages={MOCK_GALLERY_IMAGES}
      />
    </div>
  );
}
