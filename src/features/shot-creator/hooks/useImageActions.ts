import { useToast } from '@/components/ui/use-toast'
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

      // Try to write image directly to clipboard
      if (navigator.clipboard && (navigator.clipboard as { write: (items: ClipboardItem[]) => Promise<void> }).write) {
        await (navigator.clipboard as { write: (items: ClipboardItem[]) => Promise<void> }).write([
          new ClipboardItem({ [blob.type]: blob })
        ])
        toast({
          title: "Copied",
          description: "Image copied to clipboard"
        })
      } else {
        // Fallback: copy URL
        await navigator.clipboard.writeText(url)
        toast({
          title: "Copied URL",
          description: "Image URL copied to clipboard"
        })
      }
    } catch (error) {
      console.error("Copy failed", error)
      toast({
        title: "Copy Failed",
        description: "Unable to copy image to clipboard",
        variant: "destructive"
      })
    }
  }, [toast])

  return {
    handleCopyPrompt,
    handleCopyImage
  }
}
