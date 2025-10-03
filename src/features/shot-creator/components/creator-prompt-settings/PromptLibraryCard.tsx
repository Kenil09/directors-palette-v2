import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TablePromptLibrary } from './TablePromptLibrary'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
// Import to trigger module-level initialization
import '@/features/shot-creator/helpers/prompt-library-init'
import {
    Search,
    Plus,
    BookOpen,
    Grid,
    Table,
    Download,
    Upload,
    Copy,
    Hash,
    Trash2,
    Star
} from 'lucide-react'
import { useState } from "react"
import { usePromptLibraryManager } from "../../hooks/usePromptLibraryManager"
import { SavedPrompt } from "../../store/prompt-library-store"

interface PromptLibraryCardProps {
    onSelectPrompt?: (prompt: string) => void
    setIsAddPromptOpen?: (open: boolean) => void
    showQuickAccess?: boolean
}

const PromptLibraryCard = ({ onSelectPrompt, setIsAddPromptOpen, showQuickAccess }: PromptLibraryCardProps) => {
    const [activeTab, setActiveTab] = useState('categories')
    const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')

    const {
        prompts,
        categories,
        quickPrompts,
        filteredPrompts,
        categoryPrompts,
        handleExportPrompts,
        handleImportPrompts,
        setSearchQuery,
        setSelectedCategory,
        searchQuery,
        selectedCategory,
        getPromptsByCategory,
        handleSelectPrompt,
        toggleQuickAccess,
        deletePrompt,
        processPromptReplacements,
    } = usePromptLibraryManager(onSelectPrompt)


    const renderPromptCard = (prompt: SavedPrompt) => {
        const category = categories.find(c => c.id === prompt.categoryId)

        return (
            <Card key={prompt.id} className="bg-slate-950 border-slate-700 hover:border-slate-600 transition-all shadow-md">
                <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                            <h4 className="font-medium text-white mb-1">{prompt.title}</h4>
                            {prompt.reference && (
                                <Badge variant="outline" className="text-xs border-slate-600 text-slate-400 mb-2">
                                    {prompt.reference}
                                </Badge>
                            )}
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                {category && (
                                    <>
                                        <span>{category.name}</span>
                                        <span>·</span>
                                    </>
                                )}
                                <span>{new Date(prompt.metadata.updatedAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => toggleQuickAccess(prompt.id)}
                                className="h-8 w-8 p-0"
                            >
                                <Star className={`w-4 h-4 ${prompt.isQuickAccess ? 'fill-yellow-500 text-yellow-500' : 'text-slate-400'}`} />
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deletePrompt(prompt.id)}
                                className="h-8 w-8 p-0"
                            >
                                <Trash2 className="w-4 h-4 text-red-400" />
                            </Button>
                        </div>
                    </div>

                    <div className="mb-3">
                        <p className="text-sm text-gray-300 line-clamp-2">{prompt.prompt}</p>
                        {prompt.prompt.includes('@') && (
                            <p className="text-xs text-blue-400 mt-1 italic">
                                Preview: {processPromptReplacements(prompt.prompt)}
                            </p>
                        )}
                    </div>

                    {prompt.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                            {prompt.tags.map((tag, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs bg-slate-800 text-slate-400">
                                    <Hash className="w-3 h-3 mr-1" />
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    )}

                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            onClick={() => handleSelectPrompt(prompt)}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            <Copy className="w-3 h-3 mr-1" />
                            Use Prompt
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="bg-slate-900/90 border-slate-700 flex-1 flex flex-col">
            <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-blue-400" />
                        <Badge variant="outline" className="text-xs">
                            {prompts.length} prompts
                        </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* View Mode Toggle */}
                        <div className="flex rounded-lg border border-slate-700 bg-slate-800 p-1">
                            <Button
                                size="sm"
                                variant={viewMode === 'cards' ? 'default' : 'ghost'}
                                onClick={() => setViewMode('cards')}
                                className={`h-7 px-2 ${viewMode === 'cards' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                            >
                                <Grid className="w-4 h-4" />
                            </Button>
                            <Button
                                size="sm"
                                variant={viewMode === 'table' ? 'default' : 'ghost'}
                                onClick={() => setViewMode('table')}
                                className={`h-7 px-2 ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                            >
                                <Table className="w-4 h-4" />
                            </Button>
                        </div>

                        <div className="h-6 w-px bg-slate-700" />

                        <Button
                            size="sm"
                            onClick={() => handleExportPrompts()}
                            variant="outline"
                            className="border-slate-600 hover:bg-slate-800"
                        >
                            <Download className="w-4 h-4 mr-1" />
                            Export
                        </Button>

                        <Button
                            size="sm"
                            onClick={() => document.getElementById('import-prompts')?.click()}
                            variant="outline"
                            className="border-slate-600 hover:bg-slate-800"
                        >
                            <Upload className="w-4 h-4 mr-1" />
                            Import
                        </Button>

                        <input
                            id="import-prompts"
                            type="file"
                            accept=".json,.csv"
                            className="hidden"
                            onChange={handleImportPrompts}
                        />

                        <Button
                            size="sm"
                            onClick={() => setIsAddPromptOpen?.(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            <Plus className="w-4 h-4 mr-1" />
                            Add
                        </Button>
                    </div>
                </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-4">
                {/* Conditional rendering based on view mode */}
                {viewMode === 'table' ? (
                    <TablePromptLibrary
                        onSelectPrompt={onSelectPrompt}
                        showQuickAccess={showQuickAccess}
                        className="flex-1"
                    />
                ) : (
                    <>
                        {/* Search Bar */}
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                                placeholder="Search prompts..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 bg-slate-800 border-slate-700 text-white placeholder-gray-400"
                            />
                        </div>

                        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                            <TabsList className="bg-slate-800 border-slate-700">
                                <TabsTrigger value="all">All Prompts</TabsTrigger>
                                {showQuickAccess && <TabsTrigger value="quick">Quick Access</TabsTrigger>}
                                <TabsTrigger value="categories">Categories</TabsTrigger>
                            </TabsList>

                            <TabsContent value="all" className="flex-1 mt-4">
                                <ScrollArea className="h-[500px]">
                                    <div className="grid gap-3">
                                        {filteredPrompts.map(renderPromptCard)}
                                    </div>
                                </ScrollArea>
                            </TabsContent>

                            {showQuickAccess && (
                                <TabsContent value="quick" className="flex-1 mt-4">
                                    <ScrollArea className="h-[500px]">
                                        <div className="grid gap-3">
                                            {quickPrompts.map(renderPromptCard)}
                                        </div>
                                    </ScrollArea>
                                </TabsContent>
                            )}

                            <TabsContent value="categories" className="flex-1 mt-4">
                                {!selectedCategory ? (
                                    <div className="grid grid-cols-2 gap-3">
                                        {categories.map(category => {
                                            const promptCount = getPromptsByCategory(category.id).length
                                            return (
                                                <Card
                                                    key={category.id}
                                                    onClick={() => {
                                                        setSelectedCategory(category.id)
                                                    }}
                                                    className="bg-slate-950 border-slate-700 cursor-pointer transition-all hover:border-slate-600 hover:bg-slate-900"
                                                >
                                                    <CardContent className="p-4">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-2xl">{category.icon}</span>
                                                                <div>
                                                                    <h4 className="font-medium text-white">{category.name}</h4>
                                                                    <p className="text-sm text-gray-400">{promptCount} prompts</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setSelectedCategory(null)}
                                                    className="text-slate-400 hover:text-white"
                                                >
                                                    ← Back to Categories
                                                </Button>
                                                <div className="flex items-center gap-2 ml-2">
                                                    <span className="text-xl">
                                                        {categories.find(c => c.id === selectedCategory)?.icon}
                                                    </span>
                                                    <h3 className="font-medium text-white">
                                                        {categories.find(c => c.id === selectedCategory)?.name}
                                                    </h3>
                                                </div>
                                            </div>
                                        </div>
                                        <ScrollArea className="h-[450px]">
                                            <div className="grid gap-3">
                                                {categoryPrompts.length > 0 ? (
                                                    categoryPrompts.map(renderPromptCard)
                                                ) : (
                                                    <div className="text-center py-8 text-gray-400">
                                                        No prompts in this category yet
                                                    </div>
                                                )}
                                            </div>
                                        </ScrollArea>
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </>
                )}
            </CardContent>
        </Card>
    )
}

export default PromptLibraryCard
