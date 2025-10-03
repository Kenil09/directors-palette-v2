import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import React, { useCallback } from 'react'
import { useShotCreatorSettings } from "../../hooks"
import { Button } from "@/components/ui/button"
import { Shuffle } from "lucide-react"

const AdvancedSettings = () => {
    const { settings: shotCreatorSettings, updateSettings } = useShotCreatorSettings()

    // Generate random seed
    const generateRandomSeed = useCallback(() => {
        const newSeed = Math.floor(Math.random() * 1000000)
        updateSettings({ seed: newSeed })
    }, [updateSettings])

    return (
        <div className="space-y-4 border-t border-slate-700 pt-4">
            {/* Seed */}
            <div className="space-y-2">
                <Label className="text-sm text-slate-300">Seed (Optional)</Label>
                <div className="flex gap-2">
                    <Input
                        type="number"
                        value={shotCreatorSettings.seed || ''}
                        onChange={(e) => updateSettings({
                            seed: e.target.value ? parseInt(e.target.value) : undefined
                        })}
                        placeholder="Random"
                        className="bg-slate-800 border-slate-600 text-white"
                    />
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={generateRandomSeed}
                                className="bg-slate-800 border-slate-600 hover:bg-slate-700"
                            >
                                <Shuffle className="w-4 h-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Generate random seed</TooltipContent>
                    </Tooltip>
                </div>
            </div>

            {/* Number of generations control - available for all models */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-sm text-slate-300">Number of Images</Label>
                    <Input
                        type="number"
                        min="1"
                        max="4"
                        value={shotCreatorSettings.maxImages || 1}
                        onChange={(e) => updateSettings({
                            maxImages: Math.min(4, Math.max(1, parseInt(e.target.value) || 1))
                        })}
                        className="bg-slate-800 border-slate-600 text-white"
                        placeholder="1"
                    />
                    <p className="text-xs text-slate-400">Generate 1-4 images (uses more credits)</p>
                </div>
            </div>

            {shotCreatorSettings.model?.includes('qwen') && (
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-sm text-slate-300">Guidance</Label>
                        <Input
                            type="number"
                            min="0"
                            max="10"
                            step="0.1"
                            value={shotCreatorSettings.guidance || 7.5}
                            onChange={(e) => updateSettings({
                                guidance: parseFloat(e.target.value)
                            })}
                            className="bg-slate-800 border-slate-600 text-white"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm text-slate-300">Steps</Label>
                        <Input
                            type="number"
                            min="10"
                            max="50"
                            value={shotCreatorSettings.num_inference_steps || 20}
                            onChange={(e) => updateSettings({
                                num_inference_steps: parseInt(e.target.value)
                            })}
                            className="bg-slate-800 border-slate-600 text-white"
                        />
                    </div>
                </div>
            )}
        </div>
    )
}

export default AdvancedSettings