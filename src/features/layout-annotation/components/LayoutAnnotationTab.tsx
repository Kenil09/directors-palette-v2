'use client'

import React, { useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Layout, PanelLeft, PanelLeftClose, PanelRightClose, RotateCcw, Save, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    useCanvasOperations,
    useCanvasSettings,
    useImageImport,
    useIncomingImageSync
} from '../hooks'
import { useLayoutAnnotationStore } from "../store"
import { useToast } from "@/components/ui/use-toast"
import { FabricCanvas, FabricCanvasRef } from "./canvas-board"
import { CanvasSettings, CanvasToolbar } from "./canvas-settings"
import { CanvasExporter } from "./canvas-export"

interface LayoutAnnotationTabProps {
    className?: string
    setActiveTab?: (tab: string) => void
}

function LayoutAnnotationTab({ className, setActiveTab }: LayoutAnnotationTabProps) {
    const { toast } = useToast()
    const canvasRef = useRef<FabricCanvasRef | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Custom hooks for business logic
    const { sidebarCollapsed, setSidebarCollapsed, rightSidebarCollapsed, setRightSidebarCollapsed } = useLayoutAnnotationStore()
    const { canvasState, handleAspectRatioChange, updateCanvasState, updateDrawingProperties, updateCanvasSettings } = useCanvasSettings()
    const { handleUndo, handleClearCanvas, handleSaveCanvas } = useCanvasOperations({ canvasRef })
    const { handleImportClick, handleFileUpload } = useImageImport({ fileInputRef })
    useIncomingImageSync({ canvasRef })

    return (
        <div className={`flex flex-col h-full ${className}`}>
            {/* Header */}
            <Card className="bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border-purple-500/30 mb-4">
                <CardHeader className="pb-3">
                    <CardTitle className="text-white flex items-center gap-2">
                        <Layout className="w-6 h-6 text-purple-400" />
                        Layout & Annotation Canvas
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <Button
                            size="sm"
                            type="button"
                            onClick={handleImportClick}
                            className="bg-purple-600 hover:bg-purple-700 text-white transition-all"
                        >
                            <Upload className="w-4 h-4 mr-1" />
                            Import image
                        </Button>

                        <Button
                            size="sm"
                            onClick={handleSaveCanvas}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white transition-all"
                        >
                            <Save className="w-4 h-4 mr-1" />
                            Save
                        </Button>

                        <Button
                            size="sm"
                            onClick={handleUndo}
                            disabled={canvasState.historyIndex <= 0}
                            className="bg-pink-600 hover:bg-pink-700 text-white disabled:opacity-50 transition-all"
                        >
                            <RotateCcw className="w-4 h-4 mr-1" />
                            Undo
                        </Button>

                        <Button
                            size="sm"
                            onClick={handleClearCanvas}
                            variant="destructive"
                        >
                            Clear Canvas
                        </Button>

                        <div className="flex items-center gap-3 text-sm text-purple-200">
                            <Select
                                value={canvasState.aspectRatio}
                                onValueChange={handleAspectRatioChange}
                            >
                                <SelectTrigger className="bg-slate-800 border-purple-500/30 text-white h-7 w-28">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-purple-500/30">
                                    <SelectItem value="16:9" className="text-white hover:bg-purple-600/30">16:9</SelectItem>
                                    <SelectItem value="9:16" className="text-white hover:bg-purple-600/30">9:16</SelectItem>
                                    <SelectItem value="1:1" className="text-white hover:bg-purple-600/30">1:1</SelectItem>
                                    <SelectItem value="4:3" className="text-white hover:bg-purple-600/30">4:3</SelectItem>
                                    <SelectItem value="21:9" className="text-white hover:bg-purple-600/30">21:9</SelectItem>
                                    <SelectItem value="custom" className="text-white hover:bg-purple-600/30">Custom</SelectItem>
                                </SelectContent>
                            </Select>
                            <span>Zoom: {Math.round(canvasState.zoom * 100)}%</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex-1 flex gap-4 min-h-0">
                {/* Left Sidebar - Tools & Settings */}
                <div className={`${sidebarCollapsed ? 'w-12' : 'w-80'} transition-all duration-300 flex flex-col gap-4 relative`}>
                    {/* Sidebar Toggle Button */}
                    <Button
                        size="sm"
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className="absolute -right-3 top-4 z-10 bg-purple-700 hover:bg-purple-600 text-white rounded-full p-1 w-6 h-6 transition-all"
                        title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        {sidebarCollapsed ? (
                            <PanelLeft className="w-4 h-4" />
                        ) : (
                            <PanelLeftClose className="w-4 h-4" />
                        )}
                    </Button>

                    {/* Sidebar Content */}
                    <div className={`${sidebarCollapsed ? 'hidden' : 'block'}`}>
                        <CanvasSettings
                            aspectRatio={canvasState.aspectRatio}
                            canvasWidth={canvasState.canvasWidth}
                            canvasHeight={canvasState.canvasHeight}
                            backgroundColor={canvasState.backgroundColor}
                            onSettingsChange={updateCanvasSettings}
                        />

                        <CanvasToolbar
                            canvasState={canvasState}
                            onToolChange={(tool) => updateCanvasState({ tool })}
                            onPropertiesChange={updateDrawingProperties}
                        />
                    </div>
                </div>

                {/* Main Canvas Area */}
                <div className="flex-1 min-w-0">
                    <FabricCanvas
                        ref={canvasRef}
                        tool={canvasState.tool}
                        brushSize={canvasState.brushSize}
                        color={canvasState.color}
                        fillMode={canvasState.fillMode}
                        canvasWidth={canvasState.canvasWidth}
                        canvasHeight={canvasState.canvasHeight}
                        onToolChange={(tool) => updateCanvasState({ tool })}
                        onObjectsChange={(count) => {
                            // Update the status display to show object count
                            console.log(`Canvas now has ${count} objects`)
                        }}
                    />
                </div>

                {/* Right Sidebar - Export */}
                <div className={`${rightSidebarCollapsed ? 'w-12' : 'w-64'} transition-all duration-300 relative`}>
                    {/* Right Sidebar Toggle Button */}
                    <Button
                        size="sm"
                        onClick={() => setRightSidebarCollapsed(!rightSidebarCollapsed)}
                        className="absolute -left-3 top-4 z-10 bg-purple-700 hover:bg-purple-600 text-white rounded-full p-1 w-6 h-6 transition-all"
                        title={rightSidebarCollapsed ? 'Expand export panel' : 'Collapse export panel'}
                    >
                        {rightSidebarCollapsed ? (
                            <PanelLeft className="w-4 h-4" />
                        ) : (
                            <PanelRightClose className="w-4 h-4" />
                        )}
                    </Button>

                    {/* Right Sidebar Content */}
                    <div className={`${rightSidebarCollapsed ? 'hidden' : 'block'}`}>
                        <CanvasExporter
                            canvasRef={canvasRef}
                            setActiveTab={setActiveTab}
                            onExport={(format, _dataUrl) => {
                                toast({
                                    title: `Exported as ${format.toUpperCase()}`,
                                    description: "Canvas exported successfully"
                                })
                            }}
                        />
                    </div>
                </div>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
            />
        </div>
    )
}

export default LayoutAnnotationTab