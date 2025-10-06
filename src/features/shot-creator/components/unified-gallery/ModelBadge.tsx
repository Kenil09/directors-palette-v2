import { getModelIcon } from '../../constants/model-icons'

interface ModelBadgeProps {
  model?: string
}

/**
 * Displays model icon badge on image cards
 */
export function ModelBadge({ model }: ModelBadgeProps) {
  return (
    <div className="absolute top-2 left-2 pointer-events-none text-sm drop-shadow-lg">
      {getModelIcon(model)}
    </div>
  )
}
