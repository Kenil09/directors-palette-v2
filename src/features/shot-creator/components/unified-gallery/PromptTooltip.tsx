interface PromptTooltipProps {
  prompt?: string
}

/**
 * Displays prompt text on hover
 */
export function PromptTooltip({ prompt }: PromptTooltipProps) {
  return (
    <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
      <p className="text-xs text-white truncate">
        {prompt || 'No prompt available'}
      </p>
    </div>
  )
}
