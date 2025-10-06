/**
 * Model icon and color mapping
 * Based on model-config.ts model definitions
 */

export const MODEL_ICONS: Record<string, string> = {
  'nano-banana': '🍌',
  'seedream-4': '🌱',
  'gen4-image': '⚡',
  'gen4-image-turbo': '💨',
  'qwen-image': '🎨',
  'qwen-image-edit': '✏️',
}

export function getModelIcon(model?: string): string {
  if (!model) return MODEL_ICONS['nano-banana']
  return MODEL_ICONS[model] || MODEL_ICONS['nano-banana']
}
