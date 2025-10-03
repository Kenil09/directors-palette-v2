import React, { Fragment } from "react"
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion'
import {
    Sparkles,
    HelpCircle,
    BookOpen
} from 'lucide-react'
import { useShotCreatorStore } from "@/features/shot-creator/store/shot-creator.store"
import { useShotCreatorSettings } from "../../hooks"
import { PromptSyntaxFeedback } from "./PromptSyntaxFeedback"
import { PromptLibrary } from "./PromptLibrary"
import { useCallback, useEffect, useState } from "react"
import { extractAtTags, urlToFile } from "../../helpers"
import { ShotCreatorReferenceImage } from "../../types"
import { useUnifiedGalleryStore } from "../../store/unified-gallery-store"

const PromptActions = ({ textareaRef }: { textareaRef: React.RefObject<HTMLTextAreaElement | null> }) => {
    const {
        shotCreatorPrompt,
        shotCreatorProcessing,
        shotCreatorReferenceImages,
        setShotCreatorPrompt,
        setShotCreatorReferenceImages,
    } = useShotCreatorStore()
    const { settings: shotCreatorSettings } = useShotCreatorSettings()
    const [cursorPosition, setCursorPosition] = useState(0)
    console.log("cursorPosition", cursorPosition)
    const [cooldownSeconds, setCooldownSeconds] = useState(0)

    const isEditingMode = shotCreatorSettings.model === 'qwen-image-edit'
    const canGenerate = isEditingMode
        ? shotCreatorPrompt.length > 0 && shotCreatorReferenceImages.length > 0
        : shotCreatorPrompt.length > 0 && shotCreatorReferenceImages.length > 0

    // Handle cooldown timer
    useEffect(() => {
        if (cooldownSeconds > 0) {
            const timer = setTimeout(() => {
                setCooldownSeconds(cooldownSeconds - 1)
            }, 1000)
            return () => clearTimeout(timer)
        }
    }, [cooldownSeconds])

    // Reset cooldown when processing finishes
    useEffect(() => {
        if (!shotCreatorProcessing && cooldownSeconds > 0) {
            // If processing finished but cooldown is still active, clear it
            setCooldownSeconds(0)
        }
    }, [shotCreatorProcessing, cooldownSeconds])

    // Handle generation with cooldown
    const handleGenerate = useCallback(() => {
        if (canGenerate && cooldownSeconds === 0) {
            // onGenerate() //TODO :: implement
            setCooldownSeconds(3) // Start 3-second cooldown
        }
    }, [canGenerate, cooldownSeconds])

    // Handle selecting prompt from library
    const handleSelectPrompt = useCallback((prompt: string) => {
        setShotCreatorPrompt(prompt)
        // setIsPromptLibraryOpen(false)
    }, [setShotCreatorPrompt])

    // Handle @ symbol for reference support
    const handlePromptChange = useCallback(async (value: string) => {
        setShotCreatorPrompt(value);
        // Extract @ references
        const references = extractAtTags(value);
        if (references.length === 0) {
            return;
        }

        // Get all images from the gallery
        const allImages = useUnifiedGalleryStore.getState().images;
        // Create a Set to track which references we've already processed
        const processedRefs = new Set();

        // Process references one by one
        for (const ref of references) {
            const cleanRef = ref.startsWith('@') ? ref.substring(1) : ref;

            // Skip if we've already processed this reference
            if (processedRefs.has(cleanRef.toLowerCase())) {
                continue;
            }

            processedRefs.add(cleanRef.toLowerCase());

            const matchingImage = allImages.find(img => {
                if (!img.reference) return false;

                const imgRef = img.reference.toLowerCase();
                const isMatch = imgRef === `@${cleanRef.toLowerCase()}`;
                const isNotAdded = !shotCreatorReferenceImages.some(refImg => refImg.url === img.url);

                return isMatch && isNotAdded;
            });

            if (matchingImage) {
                try {
                    const file = await urlToFile(matchingImage.url, `reference-${cleanRef}.jpg`);
                    const newReference: ShotCreatorReferenceImage = {
                        id: `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        url: matchingImage.url,
                        preview: matchingImage.url,
                        file: file,
                        tags: [matchingImage.reference || `@${cleanRef}`],
                        detectedAspectRatio: matchingImage.settings?.aspectRatio || '16:9'
                    };
                    setShotCreatorReferenceImages((prev: ShotCreatorReferenceImage[]): ShotCreatorReferenceImage[] => {
                        // Check if this URL is already in the references
                        const exists = prev.some((ref: ShotCreatorReferenceImage) => ref.url === newReference.url);
                        if (exists) {
                            return prev;
                        }
                        return [...prev, newReference];
                    });
                } catch (error) {
                    console.error('Error creating file from URL:', error);
                }
            }
        }
    }, [setShotCreatorPrompt, setShotCreatorReferenceImages, shotCreatorReferenceImages]);

    return (
        <Fragment>
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label className="text-sm text-slate-300">
                        {isEditingMode ? 'Edit Instructions' : 'Prompt'}
                    </Label>
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                            @ for references
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                            Ctrl+Enter to generate
                        </Badge>
                        <span className="text-xs text-slate-400">
                            {shotCreatorPrompt.length}/1000
                        </span>
                    </div>
                </div>
                <Textarea
                    ref={textareaRef}
                    value={shotCreatorPrompt}
                    onChange={async (e) => {
                        await handlePromptChange(e.target.value);
                    }}
                    placeholder={
                        isEditingMode
                            ? "Describe how you want to edit the image (e.g., 'change the background to a sunset', 'add more lighting')"
                            : "Describe your shot... Use @ to reference tagged images"
                    }
                    className="min-h-[100px] bg-slate-800 border-slate-600 text-white placeholder:text-slate-400 resize-none"
                    maxLength={1000}
                    onSelect={(e) => {
                        const target = e.target as HTMLTextAreaElement
                        setCursorPosition(target.selectionStart)
                    }}
                    onKeyDown={(e) => {
                        // Ctrl+Enter or Cmd+Enter to generate
                        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && canGenerate && cooldownSeconds === 0 && !shotCreatorProcessing) {
                            e.preventDefault()
                            handleGenerate()
                        }
                    }}
                />

                {/* Prompt Syntax Feedback - Shows bracket/wildcard notifications */}
                <div className="space-y-2">
                    <PromptSyntaxFeedback prompt={shotCreatorPrompt} model={shotCreatorSettings.model} />

                    {/* Help Tooltip */}
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                        <HelpCircle className="w-3 h-3" />
                        <span>Use [option1, option2] for variations, _wildcard_ for dynamic content, or | for chaining</span>
                    </div>
                </div>
            </div>

            {/* Action Buttons - Moved to top for better UX */}
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Generate Button */}
                <Button
                    onClick={handleGenerate}
                    disabled={!canGenerate || cooldownSeconds > 0 || shotCreatorProcessing}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium disabled:opacity-50"
                >
                    {cooldownSeconds > 0 ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Cooldown ({cooldownSeconds}s)
                        </>
                    ) : shotCreatorProcessing ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            {isEditingMode ? 'Edit Image' : 'Generate'}
                        </>
                    )}
                </Button>

            </div>

            {/* Accordion System for Help, Prompt Library, and Import/Export */}
            <Accordion type="single" collapsible className="w-full">
                {/* Help Section */}
                <AccordionItem value="help" className="border-slate-700">
                    <AccordionTrigger className="text-slate-300 hover:text-white">
                        <div className="flex items-center gap-2">
                            <HelpCircle className="w-4 h-4" />
                            Prompting Language Guide
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                        <div className="space-y-3 text-sm text-slate-300">
                            <div className="bg-slate-800/50 rounded-lg p-3 space-y-2">
                                <div className="font-medium text-blue-400">🎯 Bracket Variations</div>
                                <div className="text-xs text-slate-400">Generate multiple images with one prompt</div>
                                <code className="block bg-slate-900 p-2 rounded text-xs text-green-400">
                                    A cat in [a garden, a car, space] looking happy
                                </code>
                                <div className="text-xs">→ Creates 3 images with different locations</div>
                            </div>

                            <div className="bg-slate-800/50 rounded-lg p-3 space-y-2">
                                <div className="font-medium text-purple-400">✨ Wild Cards</div>
                                <div className="text-xs text-slate-400">Use dynamic placeholders for creative variations</div>
                                <code className="block bg-slate-900 p-2 rounded text-xs text-green-400">
                                    _character_ holding _object_ in _location_
                                </code>
                                <div className="text-xs">→ Randomly selects from your wild card libraries</div>
                            </div>

                            <div className="bg-slate-800/50 rounded-lg p-3 space-y-2">
                                <div className="font-medium text-orange-400">🔗 Chain Prompting</div>
                                <div className="text-xs text-slate-400">Build complex images step by step</div>
                                <code className="block bg-slate-900 p-2 rounded text-xs text-green-400">
                                    sunset landscape | add flying birds | dramatic lighting
                                </code>
                                <div className="text-xs">→ Each step refines the previous result</div>
                            </div>

                            <div className="bg-slate-800/50 rounded-lg p-3 space-y-2">
                                <div className="font-medium text-cyan-400">@ References</div>
                                <div className="text-xs text-slate-400">Pull from Prompt Library categories</div>
                                <code className="block bg-slate-900 p-2 rounded text-xs text-green-400">
                                    @cinematic shot with @lighting and @mood
                                </code>
                                <div className="text-xs">→ Randomly selects prompts from each category</div>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* Prompt Library Section */}
                <AccordionItem value="library" className="border-slate-700">
                    <AccordionTrigger className="text-slate-300 hover:text-white">
                        <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            Prompt Library
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4">
                        <div className="h-[400px] overflow-y-auto">
                            <PromptLibrary
                                onSelectPrompt={handleSelectPrompt}
                                showQuickAccess={true}
                                className="h-full"
                            />
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </Fragment>
    )
}

export default PromptActions