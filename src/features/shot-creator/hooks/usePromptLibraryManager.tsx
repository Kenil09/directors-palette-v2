'use client'

import { useState, useEffect, useMemo } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { SavedPrompt, usePromptLibraryStore } from "../store/prompt-library-store"
import { getClient } from "@/lib/db/client"

export function usePromptLibraryManager(onSelectPrompt?: (prompt: string) => void) {
    const { toast } = useToast()
    const [editingPrompt, setEditingPrompt] = useState<SavedPrompt | null>(null)
    const [newPrompt, setNewPrompt] = useState({
        title: '',
        prompt: '',
        categoryId: 'custom',
        tags: '',
        isQuickAccess: false
    })

    const {
        prompts,
        categories,
        quickPrompts,
        searchQuery,
        selectedCategory,
        addPrompt,
        updatePrompt,
        deletePrompt,
        toggleQuickAccess,
        addCategory,
        setSearchQuery,
        setSelectedCategory,
        loadUserPrompts,
        getFilteredPrompts,
        getPromptsByCategory
    } = usePromptLibraryStore()

    // Load user prompts on mount
    useEffect(() => {
        const loadPrompts = async () => {
            try {
                const supabase = await getClient()
                if (supabase) {
                    const { data: { user }, error } = await supabase.auth.getUser()
                    if (!error && user) {
                        await loadUserPrompts(user.id)
                    } else {
                        await loadUserPrompts('guest')
                    }
                } else {
                    await loadUserPrompts('guest')
                }
            } catch (error) {
                console.warn('Prompt Library: Failed to check auth status, working offline:', error)
                await loadUserPrompts('guest')
            }
        }
        loadPrompts()
    }, [loadUserPrompts])

    const filteredPrompts = useMemo(() => getFilteredPrompts(), [getFilteredPrompts])
    const categoryPrompts = useMemo(() =>
        selectedCategory ? getPromptsByCategory(selectedCategory) : [],
        [selectedCategory, getPromptsByCategory]
    )

    // Add prompt
    const handleAddPrompt = async () => {
        if (!newPrompt.title || !newPrompt.prompt) {
            toast({ title: 'Error', description: 'Please fill in all required fields', variant: 'destructive' })
            return
        }

        await addPrompt({
            title: newPrompt.title,
            prompt: newPrompt.prompt,
            categoryId: newPrompt.categoryId,
            tags: newPrompt.tags.split(',').map(t => t.trim()).filter(t => t),
            isQuickAccess: newPrompt.isQuickAccess,
            reference: `@prompt_${Date.now()}`, // Add reference for @ tag access
            metadata: {
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            id: `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` // Generate ID here too
        })

        toast({ title: 'Success', description: 'Prompt added to library' })

        setNewPrompt({ title: '', prompt: '', categoryId: 'custom', tags: '', isQuickAccess: false })
    }

    // Update prompt
    const handleUpdatePrompt = async () => {
        if (!editingPrompt) return

        await updatePrompt(editingPrompt.id, editingPrompt)
        toast({ title: 'Success', description: 'Prompt updated successfully' })
        setEditingPrompt(null)
    }

    // Copy prompt
    const handleCopyPrompt = (prompt: string) => {
        navigator.clipboard.writeText(prompt)
        toast({ title: 'Copied', description: 'Prompt copied to clipboard' })
    }

    // Random prompt from category
    const getRandomFromCategory = (categoryId: string): string => {
        const prompts = getPromptsByCategory(categoryId)
        if (!prompts.length) return `@${categoryId}`
        const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)]
        const snippet = randomPrompt.prompt.split(',')[0].trim()
        return snippet.length > 50 ? snippet.substring(0, 50) + '...' : snippet
    }

    // Replace @ placeholders
    const processPromptReplacements = (prompt: string) => {
        let processed = prompt
        const mappings: Record<string, string> = {
            '@cinematic': 'cinematic',
            '@characters': 'characters',
            '@character': 'characters',
            '@lighting': 'lighting',
            '@environments': 'environments',
            '@environment': 'environments',
            '@location': 'environments',
            '@effects': 'effects',
            '@effect': 'effects',
            '@moods': 'moods',
            '@mood': 'moods',
            '@camera': 'camera',
            '@styles': 'styles',
            '@style': 'styles'
        }

        Object.entries(mappings).forEach(([placeholder, categoryId]) => {
            const regex = new RegExp(placeholder.replace('@', '\\@'), 'gi')
            processed = processed.replace(regex, () => getRandomFromCategory(categoryId))
        })

        return processed
    }

    const handleSelectPrompt = (prompt: SavedPrompt) => {
        const processed = processPromptReplacements(prompt.prompt)
        if (onSelectPrompt) onSelectPrompt(processed)
        handleCopyPrompt(processed)
    }

    // Export prompts
    const handleExportPrompts = () => {
        try {
            const exportData = {
                version: '1.0',
                exportDate: new Date().toISOString(),
                prompts: prompts.map(p => ({
                    id: p.id,
                    title: p.title,
                    prompt: p.prompt,
                    categoryId: p.categoryId,
                    tags: p.tags,
                    reference: p.reference,
                    isQuickAccess: p.isQuickAccess,
                    metadata: p.metadata
                })),
                categories: categories.filter(c => c.isEditable).map(c => ({
                    id: c.id,
                    name: c.name,
                    icon: c.icon,
                    color: c.color,
                    order: c.order
                }))
            }

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `prompt-library-${Date.now()}.json`
            a.click()
            URL.revokeObjectURL(url)
            toast({ title: 'Export Successful', description: `Exported ${prompts.length} prompts` })
        } catch (error) {
            console.error('Prompt Library: Failed to export prompts:', error)
            toast({ title: 'Export Failed', description: 'Failed to export prompts', variant: 'destructive' })
        }
    }

    // Import prompts
    const handleImportPrompts = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        try {
            const text = await file.text()
            const data = JSON.parse(text)

            if (!data.prompts || !Array.isArray(data.prompts)) throw new Error('Invalid import file format')

            if (data.categories && Array.isArray(data.categories)) {
                for (const cat of data.categories) {
                    if (!categories.find(c => c.id === cat.id)) {
                        await addCategory({ name: cat.name, icon: cat.icon, color: cat.color, isEditable: true, order: cat.order })
                    }
                }
            }

            let importedCount = 0
            for (const p of data.prompts) {
                if (!prompts.find(existing => existing.title === p.title && existing.categoryId === p.categoryId)) {
                    await addPrompt({
                        title: p.title,
                        prompt: p.prompt,
                        categoryId: p.categoryId,
                        tags: p.tags || [],
                        reference: p.reference,
                        isQuickAccess: p.isQuickAccess || false,
                        metadata: {
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                        },
                        id: `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                    })
                    importedCount++
                }
            }

            toast({ title: 'Import Successful', description: `Imported ${importedCount} new prompts` })
            event.target.value = ''
        } catch (error) {
            toast({ title: 'Import Failed', description: error instanceof Error ? error.message : 'Failed to import prompts', variant: 'destructive' })
            event.target.value = ''
        }
    }

    return {
        prompts,
        categories,
        quickPrompts,
        searchQuery,
        selectedCategory,
        filteredPrompts,
        categoryPrompts,
        editingPrompt,
        setEditingPrompt,
        newPrompt,
        setNewPrompt,
        handleAddPrompt,
        handleUpdatePrompt,
        handleCopyPrompt,
        handleSelectPrompt,
        handleExportPrompts,
        handleImportPrompts,
        setSearchQuery,
        setSelectedCategory,
        toggleQuickAccess,
        deletePrompt,
        getPromptsByCategory,
        processPromptReplacements
    }
}
