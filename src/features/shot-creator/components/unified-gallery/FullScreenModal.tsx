import React from 'react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { X, Copy, Download, ChevronLeft, ChevronRight, FileText, Link, Tag, Sparkles, Film, Layout, Save, Trash2 } from 'lucide-react'
import { useToast } from "@/components/ui/use-toast"
import { GeneratedImage } from "../../store/unified-gallery-store"

interface FullscreenModalProps {
    fullscreenImage: GeneratedImage | null
    images: GeneratedImage[]
    setFullscreenImage: (image: GeneratedImage | null) => void
    onClose: () => void
    onNavigate: (direction: 'next' | 'previous') => void
    onCopyImage: (url: string) => void
    onDownloadImage: (url: string) => void
    onDeleteImage: (url: string) => void
    onSendTo: (url: string, target: string) => void
    onSetReference: (id: string, ref: string) => void
    onAddToLibrary?: (url: string) => void
    showReferenceNamePrompt: () => Promise<string | null>
}

function FullscreenModal({
    fullscreenImage,
    setFullscreenImage,
    images,
    onClose,
    onNavigate,
    onCopyImage,
    onDownloadImage,
    onDeleteImage,
    onSendTo,
    onSetReference,
    onAddToLibrary,
    showReferenceNamePrompt
}: FullscreenModalProps) {
    const { toast } = useToast()

    if (!fullscreenImage) return null
    return (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
            <div className="relative max-w-[90vw] w-full">
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute -top-10 right-0 text-white hover:bg-white/20"
                    onClick={onClose}
                >
                    <X className="h-5 w-5" />
                </Button>

                {/* Navigation hint */}
                <div className="absolute -top-10 left-0 text-white/60 text-sm">
                    Use arrow keys to navigate • ESC to close
                </div>

                <div className="flex gap-6">
                    {/* Image with navigation buttons */}
                    <div className="flex-1 relative">
                        <Image
                            src={fullscreenImage?.url}
                            alt="Fullscreen view"
                            className="w-full max-h-[80vh] object-contain rounded-lg"
                            width={1000}
                            height={1000}
                        />

                        {/* Previous button */}
                        {images.length > 1 && (
                            <>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-black/50 hover:bg-black/70"
                                    onClick={() => onNavigate('previous')}
                                >
                                    <ChevronLeft className="h-6 w-6" />
                                </Button>

                                {/* Next button */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-black/50 hover:bg-black/70"
                                    onClick={() => onNavigate('next')}
                                >
                                    <ChevronRight className="h-6 w-6" />
                                </Button>

                                {/* Image counter */}
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white bg-black/50 px-3 py-1 rounded-full text-sm">
                                    {images.findIndex(img => img.url === fullscreenImage?.url) + 1} / {images.length}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Details Panel */}
                    <div className="w-96 bg-slate-900/90 rounded-lg p-6 max-h-[80vh] overflow-y-auto">
                        <h3 className="text-white font-semibold mb-4">Generation Details</h3>

                        {/* Prompt */}
                        <div className="mb-4">
                            <h4 className="text-slate-400 text-xs uppercase mb-2">Prompt</h4>
                            <p className="text-white text-sm leading-relaxed">{fullscreenImage.prompt}</p>
                        </div>

                        {/* Model */}
                        {fullscreenImage?.model && (
                            <div className="mb-4">
                                <h4 className="text-slate-400 text-xs uppercase mb-2">Model</h4>
                                <p className="text-white text-sm">{fullscreenImage.model}</p>
                            </div>
                        )}

                        {/* Generation Method */}
                        <div className="mb-4">
                            <h4 className="text-slate-400 text-xs uppercase mb-2">Generation Method</h4>
                            <div className="text-white text-sm">
                                {fullscreenImage?.prompt?.includes('|') ? (
                                    <div className="flex items-center gap-2">
                                        <span className="text-orange-400">🔥 Pipeline</span>
                                        <span className="text-slate-400">Multi-step generation</span>
                                    </div>
                                ) : fullscreenImage.prompt?.includes('[') && fullscreenImage.prompt?.includes(']') ? (
                                    <div className="flex items-center gap-2">
                                        <span className="text-blue-400">📝 Brackets</span>
                                        <span className="text-slate-400">Option selection</span>
                                    </div>
                                ) : fullscreenImage.prompt?.includes('_') ? (
                                    <div className="flex items-center gap-2">
                                        <span className="text-purple-400">🎲 Wildcards</span>
                                        <span className="text-slate-400">Random variations</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <span className="text-green-400">✨ Standard</span>
                                        <span className="text-slate-400">Direct prompt</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Source */}
                        <div className="mb-4">
                            <h4 className="text-slate-400 text-xs uppercase mb-2">Generated From</h4>
                            <p className="text-white text-sm capitalize">{fullscreenImage?.source?.replace('-', ' ')}</p>
                        </div>

                        {/* Resolution */}
                        <div className="mb-4">
                            <h4 className="text-slate-400 text-xs uppercase mb-2">Resolution</h4>
                            <p className="text-white text-sm">
                                {fullscreenImage.width && fullscreenImage.height
                                    ? `${fullscreenImage.width} × ${fullscreenImage.height}`
                                    : (() => {
                                        // Map resolution strings to actual dimensions
                                        const resolutionMap: Record<string, string> = {
                                            '720p': '1280 × 720',
                                            '1080p': '1920 × 1080',
                                            '1K': '1024 × 1024',
                                            '2K': '2048 × 2048',
                                            '4K': '4096 × 4096',
                                            'HD': '1920 × 1080',
                                            'FHD': '1920 × 1080',
                                            'UHD': '3840 × 2160'
                                        };

                                        const resolution = fullscreenImage.settings?.resolution;
                                        if (resolution && resolutionMap[resolution]) {
                                            return resolutionMap[resolution];
                                        }

                                        // If resolution has custom dimensions, use them
                                        if (fullscreenImage.settings?.custom_width && fullscreenImage.settings?.custom_height) {
                                            return `${fullscreenImage.settings.custom_width} × ${fullscreenImage.settings.custom_height}`;
                                        }

                                        // Default based on aspect ratio if available
                                        const aspectRatio = fullscreenImage.settings?.aspect_ratio;
                                        const aspectRatioDefaults: Record<string, string> = {
                                            '16:9': '1920 × 1080',
                                            '9:16': '1080 × 1920',
                                            '1:1': '1024 × 1024',
                                            '4:3': '1024 × 768',
                                            '3:4': '768 × 1024',
                                            '21:9': '2560 × 1080',
                                            '3:2': '1536 × 1024',
                                            '2:3': '1024 × 1536'
                                        };

                                        if (aspectRatio && aspectRatioDefaults[aspectRatio]) {
                                            return aspectRatioDefaults[aspectRatio];
                                        }

                                        // Final fallback
                                        return resolution || '1024 × 1024';
                                    })()}
                            </p>
                        </div>

                        {/* Timestamp */}
                        <div className="mb-4">
                            <h4 className="text-slate-400 text-xs uppercase mb-2">Created</h4>
                            <p className="text-white text-sm">
                                {new Date(fullscreenImage.createdAt || Date.now()).toLocaleString()}
                            </p>
                        </div>

                        {/* Chain Info */}
                        {fullscreenImage.chain && (
                            <div className="mb-4 p-3 bg-purple-900/30 rounded">
                                <h4 className="text-purple-300 text-xs uppercase mb-2">Pipeline Step</h4>
                                <p className="text-white text-sm">
                                    Step {fullscreenImage.chain.stepNumber} of {fullscreenImage.chain.totalSteps}
                                </p>
                                <p className="text-purple-200 text-xs mt-1">{fullscreenImage.chain.stepPrompt}</p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="mt-6 space-y-2">
                            {/* Primary action row */}
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1 text-white border-slate-600"
                                    onClick={() => onCopyImage(fullscreenImage.url)}
                                    title="Copy to Clipboard"
                                >
                                    <Copy className="w-3.5 h-3.5 mr-1" />
                                    Copy
                                </Button>

                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1 text-white border-slate-600"
                                    onClick={() => onDownloadImage(fullscreenImage.url)}
                                    title="Download Image"
                                >
                                    <Download className="w-3.5 h-3.5 mr-1" />
                                    Download
                                </Button>
                            </div>

                            {/* Secondary actions */}
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1 text-white border-slate-600"
                                    onClick={() => {
                                        if (fullscreenImage.prompt) {
                                            navigator.clipboard.writeText(fullscreenImage.prompt)
                                            toast({
                                                title: "Prompt Copied",
                                                description: "Prompt copied to clipboard"
                                            })
                                        }
                                    }}
                                    title="Copy Prompt"
                                >
                                    <FileText className="w-3.5 h-3.5 mr-1" />
                                    Copy Prompt
                                </Button>

                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1 text-white border-slate-600"
                                    onClick={() => {
                                        navigator.clipboard.writeText(fullscreenImage.url)
                                        toast({
                                            title: "URL Copied",
                                            description: "Image URL copied to clipboard"
                                        })
                                    }}
                                    title="Copy Image URL"
                                >
                                    <Link className="w-3.5 h-3.5 mr-1" />
                                    Copy URL
                                </Button>
                            </div>

                            {/* Send to options */}
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1 text-white border-slate-600"
                                    onClick={async () => {
                                        const newRef = await showReferenceNamePrompt()
                                        if (newRef) {
                                            onSetReference(fullscreenImage.id, newRef)
                                            toast({
                                                title: "Reference Set",
                                                description: `Image tagged as ${newRef}`
                                            })
                                        }
                                    }}
                                    title="Set as Reference"
                                >
                                    <Tag className="w-3.5 h-3.5 mr-1" />
                                    Reference
                                </Button>

                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1 text-white border-slate-600"
                                    onClick={() => onSendTo(fullscreenImage?.url, 'shot-creator')}
                                    title="Send to Shot Creator"
                                >
                                    <Sparkles className="w-3.5 h-3.5 mr-1" />
                                    Creator
                                </Button>
                            </div>

                            {/* More send options */}
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1 text-white border-slate-600"
                                    onClick={() => onSendTo(fullscreenImage?.url, 'shot-animator')}
                                    title="Send to Shot Animator"
                                >
                                    <Film className="w-3.5 h-3.5 mr-1" />
                                    Animator
                                </Button>

                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1 text-white border-slate-600"
                                    onClick={() => onSendTo(fullscreenImage.url, 'layout-annotation')}
                                    title="Send to Layout"
                                >
                                    <Layout className="w-3.5 h-3.5 mr-1" />
                                    Layout
                                </Button>
                            </div>

                            {/* Library and delete */}
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1 text-white border-slate-600"
                                    onClick={() => {
                                        onAddToLibrary?.(fullscreenImage.url)
                                        toast({
                                            title: "Added to Library",
                                            description: "Image saved to reference library"
                                        })
                                    }}
                                    title="Add to Library"
                                >
                                    <Save className="w-3.5 h-3.5 mr-1" />
                                    Add to Library
                                </Button>

                                <Button
                                    size="sm"
                                    variant="destructive"
                                    className="flex-1"
                                    onClick={() => {
                                        const currentIndex = images.findIndex(img => img.url === fullscreenImage.url)

                                        // Delete the image from the gallery
                                        onDeleteImage(fullscreenImage.url)

                                        // If there are other images, show the next/previous one
                                        if (images.length > 1) {
                                            // Calculate remaining images after deletion
                                            const remainingImages = images.filter(img => img.url !== fullscreenImage.url)

                                            if (remainingImages.length > 0) {
                                                // Prefer showing the image at the same index position
                                                // If we deleted the last image, show the previous one
                                                const nextIndex = Math.min(currentIndex, remainingImages.length - 1)
                                                setFullscreenImage(remainingImages[nextIndex])
                                            } else {
                                                // No images left, close modal
                                                setFullscreenImage(null)
                                            }
                                        } else {
                                            // This was the only image, close modal
                                            setFullscreenImage(null)
                                        }
                                    }}
                                    title="Delete Image"
                                >
                                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                                    Delete
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default FullscreenModal