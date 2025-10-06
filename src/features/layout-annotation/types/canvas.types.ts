/**
 * Canvas API Type Definition
 */

import { Canvas } from "fabric"

export interface CanvasAPI {
  undo?: () => void
  redo?: () => void
  clear?: () => void
  exportCanvas?: (format: string) => string
  importImage?: (url: string) => void
}

export interface CanvasEditorRef {
  undo: () => void
  redo: () => void
  clear: () => void
  exportCanvas: (format: string) => string
  addImage: (imageUrl: string) => void
  getCanvas: () => Canvas | null
}