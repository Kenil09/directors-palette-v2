'use client'

import React, { useState, useCallback, useRef, Fragment, useEffect } from 'react'
import {
  Play,
  Loader2,
  AlertCircle,
  Trash2,
  Download,
  Maximize2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import useEmblaCarousel from 'embla-carousel-react'
import { ShotGeneratedVideo } from '../types'
import { FullscreenVideoModal } from './FullscreenVideoModal'

interface CompactVideoCardProps {
  videos: ShotGeneratedVideo[]
  onDeleteVideo?: (galleryId: string) => void
}

export function CompactVideoCard({
  videos,
  onDeleteVideo
}: CompactVideoCardProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: 'start',
    containScroll: 'trimSnaps',
    skipSnaps: false
  })
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [playingIndex, setPlayingIndex] = useState<number | null>(null)
  const [fullscreenVideo, setFullscreenVideo] = useState<string | null>(null)
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])

  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext()
  }, [emblaApi])

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
    // Pause all videos when sliding
    videoRefs.current.forEach(video => video?.pause())
    setPlayingIndex(null)
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)
    return () => {
      emblaApi.off('select', onSelect)
      emblaApi.off('reInit', onSelect)
    }
  }, [emblaApi, onSelect])

  const togglePlayPause = (index: number) => {
    const video = videoRefs.current[index]
    if (!video) return

    if (playingIndex === index) {
      video.pause()
      setPlayingIndex(null)
    } else {
      videoRefs.current.forEach((v, i) => {
        if (i !== index && v) v.pause()
      })
      video.play()
      setPlayingIndex(index)
    }
  }

  const getStatusDisplay = (video: ShotGeneratedVideo) => {
    switch (video.status) {
      case 'processing':
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90">
            <Loader2 className="h-8 w-8 text-purple-400 animate-spin mb-2" />
            <p className="text-xs text-slate-300">Generating...</p>
          </div>
        )
      case 'failed':
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/90">
            <AlertCircle className="h-8 w-8 text-red-400 mb-2" />
            <p className="text-xs text-red-300">Failed</p>
            {video.error && (
              <p className="text-xs text-red-400 mt-1 px-2 text-center">{video.error}</p>
            )}
          </div>
        )
      case 'pending':
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/50">
            <Loader2 className="h-8 w-8 text-slate-500 animate-pulse mb-2" />
            <p className="text-xs text-slate-400">Waiting...</p>
          </div>
        )
      default:
        return null
    }
  }

  const handleDownload = async (videoUrl: string, videoId: string) => {
    try {
      // Fetch the image as a blob
      const response = await fetch(videoUrl)
      const blob = await response.blob()

      // Create a temporary URL for the blob
      const blobUrl = URL.createObjectURL(blob)

      // Create and trigger download
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = `reference_${videoId}.mp4`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Clean up the blob URL
      URL.revokeObjectURL(blobUrl)
    } catch (error) {
      console.error('Failed to download video:', error)
      alert('Could not download video. Please try again.')
    }
  }

  const visibleVideos = videos.filter(
    (video) => video.status !== 'failed'
  )

  if (visibleVideos.length === 0) return null

  const canScrollPrev = emblaApi?.canScrollPrev() ?? false
  const canScrollNext = emblaApi?.canScrollNext() ?? false
  const showNavigation = visibleVideos.length > 1

  return (
    <>
      <div className="space-y-2">
        <Badge variant="default" className="text-xs bg-purple-600 mb-2">
          Generated Videos ({visibleVideos.length})
        </Badge>
        <div className="overflow-hidden rounded-xl w-full" ref={emblaRef}>
          <div className="flex touch-pan-y" style={{ backfaceVisibility: 'hidden' }}>
            {visibleVideos.map((video, index) => (
              <div
                key={video.galleryId}
                className="flex-shrink-0 flex-grow-0 basis-full min-w-0 relative px-1 first:pl-0 last:pr-1"
                style={{ flex: '0 0 100%' }}
              >
                <div className="relative rounded-xl overflow-hidden border border-purple-600 w-full group">
                  {video.videoUrl && video.status === 'completed' ? (
                    <Fragment>
                      {/* Keep all video cards consistent with aspect-video */}
                      <div className="relative aspect-video bg-black rounded-xl overflow-hidden group">
                        <video
                          ref={(el) => {
                            videoRefs.current[index] = el
                          }}
                          src={video.videoUrl}
                          className="w-full h-full object-cover"
                          loop
                          controls
                          playsInline
                          preload="metadata"
                          onClick={() => togglePlayPause(index)}
                        />

                        {/* Play overlay */}
                        {playingIndex !== index && (
                          <div
                            className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/50 transition-all cursor-pointer"
                            onClick={() => togglePlayPause(index)}
                          >
                            <div className="w-16 h-16 rounded-full bg-purple-600 flex items-center justify-center hover:scale-110 transition-transform">
                              <Play className="h-8 w-8 text-white ml-1" fill="white" />
                            </div>
                          </div>
                        )}

                        {/* Hover controls (always visible when hovering anywhere) */}
                        <div className="absolute inset-0 flex justify-end items-start p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          <div className="flex gap-1 bg-gradient-to-t from-black/80 to-transparent rounded-lg p-1 pointer-events-auto">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setFullscreenVideo(video.videoUrl!)}
                              className="h-8 w-8 text-white hover:bg-white/20"
                            >
                              <Maximize2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDownload(video.videoUrl!, video.galleryId)}
                              className="h-8 w-8 text-white hover:bg-white/20"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            {onDeleteVideo && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onDeleteVideo(video.galleryId)
                                }}
                                className="h-8 w-8 text-red-400 hover:bg-red-500/20"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </Fragment>
                  ) : (
                    <div className="relative w-full aspect-video bg-slate-900 rounded-xl">
                      {getStatusDisplay(video)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Carousel Navigation */}
          {showNavigation && (
            <div className="flex items-center justify-center gap-2 mt-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={scrollPrev}
                disabled={!canScrollPrev}
                className="h-6 w-6 rounded-full bg-slate-700 hover:bg-slate-600 disabled:opacity-30 text-white"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-slate-400 min-w-[40px] text-center font-medium">
                {selectedIndex + 1}/{visibleVideos.length}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={scrollNext}
                disabled={!canScrollNext}
                className="h-6 w-6 rounded-full bg-slate-700 hover:bg-slate-600 disabled:opacity-30 text-white"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

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
