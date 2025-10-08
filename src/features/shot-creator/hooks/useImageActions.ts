import { useToast } from '@/hooks/use-toast'
import { useCallback } from 'react'

/**
 * Custom hook for image-related actions
 * Handles copying prompts and images to clipboard
 */
export function useImageActions() {
  const { toast } = useToast()

  const handleCopyPrompt = useCallback((prompt?: string) => {
    if (prompt) {
      navigator.clipboard.writeText(prompt)
      toast({
        title: "Prompt Copied",
        description: "The prompt has been copied to your clipboard"
      })
    }
  }, [toast])

  const handleCopyImage = useCallback(async (url: string) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()

      // Check if clipboard API is available
      if (!navigator.clipboard || !(navigator.clipboard as { write?: (items: ClipboardItem[]) => Promise<void> }).write) {
        // Fallback: copy URL instead
        await navigator.clipboard.writeText(url)
        toast({
          title: "Copied URL",
          description: "Image URL copied to clipboard"
        })
        return
      }

      // Convert image to PNG - most browsers only support PNG in clipboard
      // Only skip conversion if already PNG
      if (blob.type !== 'image/png') {
        // Create an image element to convert the format
        const img = new Image()
        const objectUrl = URL.createObjectURL(blob)

        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = reject
          img.src = objectUrl
        })

        // Create a canvas and draw the image
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('Could not get canvas context')

        ctx.drawImage(img, 0, 0)
        URL.revokeObjectURL(objectUrl)

        // Convert canvas to PNG blob
        const pngBlob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((b) => {
            if (b) resolve(b)
            else reject(new Error('Failed to convert to PNG'))
          }, 'image/png')
        })

        // Copy PNG to clipboard
        await (navigator.clipboard as { write: (items: ClipboardItem[]) => Promise<void> }).write([
          new ClipboardItem({ 'image/png': pngBlob })
        ])
      } else {
        // Copy directly if already PNG
        await (navigator.clipboard as { write: (items: ClipboardItem[]) => Promise<void> }).write([
          new ClipboardItem({ 'image/png': blob })
        ])
      }

      toast({
        title: "Copied",
        description: "Image copied to clipboard"
      })
    } catch (error) {
      console.error("Copy failed", error)
      // Fallback: try to copy URL instead
      try {
        await navigator.clipboard.writeText(url)
        toast({
          title: "Copied URL",
          description: "Image URL copied to clipboard (image format not supported)"
        })
      } catch {
        toast({
          title: "Copy Failed",
          description: "Unable to copy to clipboard",
          variant: "destructive"
        })
      }
    }
  }, [toast])

  return {
    handleCopyPrompt,
    handleCopyImage
  }
}
