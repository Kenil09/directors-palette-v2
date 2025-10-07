'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Play, Pause, Download, Maximize2, Grid3x3, List } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FullscreenVideoModal } from "./FullscreenVideoModal"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Pagination } from "@/features/shot-creator/components/unified-gallery/Pagination"
import { VideoGalleryService } from "../services/gallery.service"
import type { GeneratedVideo } from "../types"

type ViewMode = 'grid' | 'list'

interface VideoPreviewsModalProps {
    isOpen: boolean
    onClose: () => void
}

const VideoPreviewsModal = ({ isOpen, onClose }: VideoPreviewsModalProps) => {
    const [videos, setVideos] = useState<GeneratedVideo[]>([])
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(0)
    const [isLoading, setIsLoading] = useState(false)
    const [playingVideo, setPlayingVideo] = useState<string | null>(null)
    const [fullscreenVideo, setFullscreenVideo] = useState<string | null>(null)
    const [viewMode, setViewMode] = useState<ViewMode>('grid')
    const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({})
    const pageSize = 6

    // Load videos with pagination
    useEffect(() => {
        if (!isOpen) return

        const loadVideos = async () => {
            setIsLoading(true)
            try {
                const result = await VideoGalleryService.loadUserVideosPaginated(currentPage, pageSize)
                setVideos(result.videos)
                setTotalPages(result.totalPages)
            } catch (error) {
                console.error('Failed to load videos:', error)
            } finally {
                setIsLoading(false)
            }
        }

        loadVideos()
    }, [isOpen, currentPage])

    const handleCancel = () => {
        // Pause all videos when closing
        Object.values(videoRefs.current).forEach(video => {
            if (video) {
                video.pause()
                video.currentTime = 0
            }
        })
        setPlayingVideo(null)
        onClose()
    }

    const togglePlayPause = (videoId: string) => {
        const video = videoRefs.current[videoId]
        if (!video) return

        if (playingVideo === videoId) {
            video.pause()
            setPlayingVideo(null)
        } else {
            // Pause all other videos
            Object.entries(videoRefs.current).forEach(([id, v]) => {
                if (id !== videoId && v) {
                    v.pause()
                    v.currentTime = 0
                }
            })
            video.play()
            setPlayingVideo(videoId)
        }
    }

    const handleDownload = async (videoUrl: string, videoId: string) => {
        try {
            const response = await fetch(videoUrl)
            const blob = await response.blob()
            const blobUrl = URL.createObjectURL(blob)

            const link = document.createElement('a')
            link.href = blobUrl
            link.download = `reference_${videoId}.mp4`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            URL.revokeObjectURL(blobUrl)
        } catch (error) {
            console.error('Failed to download video:', error)
            alert('Could not download video. Please try again.')
        }
    }

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-6xl bg-slate-900 border-slate-700 text-white">
                    <DialogHeader>
                        <div className="flex items-center justify-between mt-4">
                            <div>
                                <DialogTitle>Video Gallery</DialogTitle>
                                <DialogDescription className="text-slate-400">
                                    Explore your AI-generated videos and find inspiration for your next creation.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {/* View Mode Toggle */}
                    <div className="my-2 flex justify-end pr-4">
                        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'grid' | 'list')}>
                            <TabsList className="bg-slate-800 border border-slate-700 rounded-lg h-9">
                                <TabsTrigger
                                    value="grid"
                                    className="flex items-center gap-2 px-3 data-[state=active]:bg-purple-600 data-[state=active]:text-white text-slate-300"
                                >
                                    <Grid3x3 className="w-4 h-4" />
                                    Grid
                                </TabsTrigger>
                                <TabsTrigger
                                    value="list"
                                    className="flex items-center gap-2 px-3 data-[state=active]:bg-purple-600 data-[state=active]:text-white text-slate-300"
                                >
                                    <List className="w-4 h-4" />
                                    List
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                    <ScrollArea className="h-[500px] pr-4">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                                <div className="animate-spin w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full mb-4"></div>
                                <p>Loading videos...</p>
                            </div>
                        ) : videos.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                                <Play className="w-16 h-16 mb-4" />
                                <p>No videos in gallery</p>
                                <p className="text-sm mt-2">Generate some videos to see them here</p>
                            </div>
                        ) : (
                            <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-4' : 'flex flex-col gap-4'}>
                                {videos.map((video) => {
                                    const isPlaying = playingVideo === video.id
                                    return (
                                        <div
                                            key={video.id}
                                            className={`relative group rounded-lg overflow-hidden border-2 transition-all ${isPlaying
                                                ? 'border-purple-500 ring-2 ring-purple-500/30'
                                                : 'border-slate-700 hover:border-slate-600'
                                                } ${viewMode === 'list' ? 'flex flex-row' : ''}`}
                                        >
                                            {/* Video Preview */}
                                            <div className={`relative bg-slate-800 rounded-lg overflow-hidden ${viewMode === 'grid' ? 'aspect-video' : 'w-64 h-36'}`}>
                                                <video
                                                    ref={(el) => {
                                                        videoRefs.current[video.id] = el
                                                    }}
                                                    src={video.videoUrl}
                                                    className="w-full h-full object-cover cursor-pointer"
                                                    playsInline
                                                    preload="metadata"
                                                    onClick={() => togglePlayPause(video.id)}
                                                />

                                                {/* Overlay */}
                                                <div
                                                    className={`absolute inset-0 transition-opacity ${isPlaying ? 'bg-purple-500/10' : 'bg-black/30 group-hover:bg-black/20'}`}
                                                    onClick={() => togglePlayPause(video.id)}
                                                />

                                                {/* Hover Controls - Top Right */}
                                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                    <div className="flex gap-2 bg-black/80 rounded-lg p-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                setFullscreenVideo(video.videoUrl)
                                                                onClose()
                                                            }}
                                                            className="h-5 w-5 text-white hover:bg-white/20"
                                                        >
                                                            <Maximize2 className="h-3 w-3" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleDownload(video.videoUrl, video.id)
                                                            }}
                                                            className="h-5 w-5 text-white hover:bg-white/20"
                                                        >
                                                            <Download className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </div>

                                                {/* Play/Pause Icon - Center */}
                                                <div
                                                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                                                    onClick={() => togglePlayPause(video.id)}
                                                >
                                                    {!isPlaying && (
                                                        <div className="w-16 h-16 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors pointer-events-auto cursor-pointer">
                                                            <Play className="h-8 w-8 text-white ml-1" fill="white" />
                                                        </div>
                                                    )}
                                                    {isPlaying && (
                                                        <div className="w-16 h-16 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors opacity-0 group-hover:opacity-100 pointer-events-auto cursor-pointer">
                                                            <Pause className="h-8 w-8 text-white" fill="white" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Video Info */}
                                            <div className={`bg-slate-800/90 ${viewMode === 'grid' ? 'p-2' : 'flex-1 p-4 flex flex-col justify-center'}`}>
                                                <p className={`text-slate-300 ${viewMode === 'grid' ? 'text-xs truncate' : 'text-sm font-medium mb-1'}`}>
                                                    {video.shotName}
                                                </p>
                                                {viewMode === 'list' && (
                                                    <p className="text-xs text-slate-500">
                                                        {new Date(video.createdAt).toLocaleDateString()}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </ScrollArea>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="mt-4">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={handleCancel}
                            className="bg-slate-800 border-slate-600"
                        >
                            Cancel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Fullscreen Modal */}
            {fullscreenVideo && (
                <FullscreenVideoModal
                    videoUrl={fullscreenVideo}
                    isOpen={!!fullscreenVideo}
                    onClose={() => setFullscreenVideo(null)}
                />
            )}
        </>
    )
}

export default VideoPreviewsModal
