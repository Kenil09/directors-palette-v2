import React from 'react'
import { useShotCreatorSettings } from "../../hooks"
import { aspectRatios, resolutions } from "../../constants"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

const BasicSettings = () => {
    const { settings: shotCreatorSettings, updateSettings } = useShotCreatorSettings()
    return (
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label className="text-sm text-slate-300">Aspect Ratio</Label>
                <Select
                    value={shotCreatorSettings.aspectRatio}
                    onValueChange={(value) => updateSettings({ aspectRatio: value })}
                >
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {aspectRatios.map((ratio) => (
                            <SelectItem key={ratio.value} value={ratio.value}>
                                {ratio.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label className="text-sm text-slate-300">Resolution</Label>
                <Select
                    value={shotCreatorSettings.resolution}
                    onValueChange={(value) => updateSettings({ resolution: value })}
                >
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {resolutions.map((res) => (
                            <SelectItem key={res.value} value={res.value}>
                                {res.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    )
}

export default BasicSettings