/**
 * Canvas Settings Hook
 *
 * Handles canvas configuration and settings updates
 */

import { useCallback } from 'react'
import { useLayoutAnnotationStore } from '../store'
import { DrawingProperties, CanvasState } from '../types'
import { ASPECT_RATIOS } from '../constants'

export function useCanvasSettings() {
  const { canvasState, setCanvasState } = useLayoutAnnotationStore()

  const updateCanvasState = useCallback((updates: Partial<CanvasState>) => {
    setCanvasState(prev => ({ ...prev, ...updates }))
  }, [setCanvasState])

  const updateDrawingProperties = useCallback((properties: Partial<DrawingProperties>) => {
    updateCanvasState(properties)
  }, [updateCanvasState])

  const updateCanvasSettings = useCallback((settings: {
    aspectRatio: string
    canvasWidth: number
    canvasHeight: number
    backgroundColor: string
  }) => {
    updateCanvasState(settings)
  }, [updateCanvasState])

  const handleAspectRatioChange = useCallback((newRatio: string) => {
    const ratio = ASPECT_RATIOS.find(r => r.id === newRatio)
    if (ratio) {
      updateCanvasSettings({
        aspectRatio: newRatio,
        canvasWidth: ratio.width,
        canvasHeight: ratio.height,
        backgroundColor: canvasState.backgroundColor
      })
    } else if (newRatio === 'custom') {
      updateCanvasSettings({
        aspectRatio: newRatio,
        canvasWidth: canvasState.canvasWidth,
        canvasHeight: canvasState.canvasHeight,
        backgroundColor: canvasState.backgroundColor
      })
    }
  }, [canvasState, updateCanvasSettings])

  return {
    canvasState,
    updateCanvasState,
    updateDrawingProperties,
    updateCanvasSettings,
    handleAspectRatioChange
  }
}
