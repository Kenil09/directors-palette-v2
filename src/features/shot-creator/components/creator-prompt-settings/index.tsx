import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import {
    Palette,
    Settings,
    ChevronDown,
    ChevronUp,
    Copy
} from 'lucide-react'
import { useShotCreatorStore } from "@/features/shot-creator/store/shot-creator.store"
import { useShotCreatorSettings } from "../../hooks"
import { getModelConfig, ModelId } from "@/config/index"
import { useCallback, useRef, useState } from "react"
import { quickPresets } from "../../constants"
import AdvancedSettings from "./AdvancedSettings"
import BasicSettings from "./BasicSettings"
import PromptActions from "./PromptActions"

const CreatorPromptSettings = ({ compact }: { compact?: boolean }) => {
    const [showAdvanced, setShowAdvanced] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const { shotCreatorPrompt, setShotCreatorPrompt, shotCreatorReferenceImages } = useShotCreatorStore()
    const { settings: shotCreatorSettings } = useShotCreatorSettings()

    const modelConfig = getModelConfig((shotCreatorSettings.model || 'seedream-4') as ModelId)
    const isEditingMode = shotCreatorSettings.model === 'qwen-image-edit'

    const referenceImagesCount = shotCreatorReferenceImages.length
    const hasNonPipelineImages = shotCreatorReferenceImages.some(img => img.url && !img.url.includes('pipeline'))

    // Insert preset into prompt at cursor position
    const insertPreset = useCallback((presetPrompt: string) => {
        if (textareaRef.current) {
            const textarea = textareaRef.current
            const start = textarea.selectionStart
            const end = textarea.selectionEnd
            const currentPrompt = shotCreatorPrompt

            // Insert preset at cursor position
            const newPrompt = currentPrompt.slice(0, start) + presetPrompt + currentPrompt.slice(end)
            setShotCreatorPrompt(newPrompt)

            // Update cursor position
            setTimeout(() => {
                textarea.focus()
                textarea.setSelectionRange(start + presetPrompt.length, start + presetPrompt.length)
            }, 0)
        }
    }, [shotCreatorPrompt, setShotCreatorPrompt])

    // Copy current settings
    const copySettings = useCallback(() => {
        const settingsText = JSON.stringify(shotCreatorSettings, null, 2)
        navigator.clipboard.writeText(settingsText)
    }, [shotCreatorSettings])

    return (
        <TooltipProvider>
            <div className="p-4 lg:p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Palette className="w-5 h-5 text-blue-400" />
                        <h3 className="text-white font-medium">
                            {isEditingMode ? 'Edit Instructions' : 'Prompt & Settings'}
                        </h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={copySettings}
                                    className="text-slate-400 hover:text-white"
                                >
                                    <Copy className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Copy settings</TooltipContent>
                        </Tooltip>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="text-slate-400 hover:text-white"
                        >
                            <Settings className="w-4 h-4 mr-1" />
                            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                    </div>
                </div>

                {/* Quick Presets */}
                {!compact && (
                    <div className="space-y-2">
                        <Label className="text-sm text-slate-300">Quick Presets</Label>
                        <div className="flex flex-wrap gap-2">
                            {quickPresets.map((preset) => (
                                <Button
                                    key={preset.name}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => insertPreset(preset.prompt)}
                                    className="text-xs bg-slate-800 border-slate-600 hover:bg-slate-700 text-slate-300"
                                >
                                    {preset.name}
                                </Button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Prompt Input */}
                <PromptActions textareaRef={textareaRef} />

                {/* Basic Settings */}
                <BasicSettings />

                {/* Advanced Settings */}
                {showAdvanced && (
                    <AdvancedSettings />
                )}

                {/* Status Info */}
                <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>
                        {referenceImagesCount} reference image{referenceImagesCount !== 1 ? 's' : ''} • {modelConfig.name}
                    </span>
                    {hasNonPipelineImages && (
                        <Badge variant="secondary" className="text-xs">
                            Ready
                        </Badge>
                    )}
                </div>
            </div>

        </TooltipProvider>
    )
}

export default CreatorPromptSettings