import React, { useEffect } from 'react'
import { LibraryCategory, useLibraryStore } from "../../store/shot-library.store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Maximize2, Edit3, Users, MapPin, Package, ImageIcon, Layout, Trash2 } from "lucide-react"
import Image from "next/image"
import { useShotCreatorStore } from "../../store"

const categoryConfig = {
    'all': { icon: ImageIcon, label: 'All', color: 'slate' },
    'people': { icon: Users, label: 'People', color: 'blue' },
    'places': { icon: MapPin, label: 'Places', color: 'green' },
    'props': { icon: Package, label: 'Props', color: 'orange' },
    'layouts': { icon: Layout, label: 'Layouts', color: 'purple' }
}

const ShotReferenceLibrary = () => {
    const { setFullscreenImage } = useShotCreatorStore()
    const {
        libraryItems,
        libraryCategory,
        setLibraryCategory,
        libraryLoading,
        loadLibraryItems,
        updateItemCategory,
        deleteItem
    } = useLibraryStore()

    // Load library items on mount
    useEffect(() => {
        loadLibraryItems()
    }, [loadLibraryItems])

    const filteredItems = libraryCategory === 'all'
        ? libraryItems
        : libraryItems.filter(item => item.category === libraryCategory)

    const onCategoryChange = async (itemId: string, newCategory: string) => {
        await updateItemCategory(itemId, newCategory)
    }

    const onDeleteItem = async (itemId: string) => {
        await deleteItem(itemId)
    }

    return (
        <Card className="bg-slate-900 border-slate-700">
            <CardHeader className="pb-4">
                <CardTitle className="text-white flex items-center justify-between">
                    <span>Reference Library</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {/* Category Filter */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {Object.entries(categoryConfig).map(([key, config]) => {
                        const IconComponent = config.icon
                        const isActive = libraryCategory === key

                        return (
                            <Button
                                key={key}
                                size="sm"
                                variant={isActive ? "default" : "outline"}
                                onClick={() => setLibraryCategory(key as LibraryCategory)}
                                className={`h-8 ${isActive ? 'bg-purple-600 hover:bg-purple-700' : 'border-slate-600 text-slate-300'}`}
                            >
                                <IconComponent className="w-3 h-3 mr-1" />
                                {config.label}
                            </Button>
                        )
                    })}
                </div>

                {/* Library Grid */}
                {libraryLoading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                        <p className="text-slate-400 text-sm">Loading library...</p>
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="text-center py-8">
                        <ImageIcon className="w-12 h-12 text-slate-500 mx-auto mb-2" />
                        <p className="text-slate-400 text-sm">Library is empty</p>
                    </div>
                ) : (
                    <ScrollArea className="h-80">
                        <div className="grid grid-cols-3 gap-3">
                            {filteredItems.map((item) => (
                                <div key={item.id} className="relative group">
                                    <div
                                        className="rounded border border-slate-600 overflow-hidden bg-slate-800 cursor-pointer hover:border-purple-500 transition-colors"
                                        onClick={() => setFullscreenImage(item)}
                                    >
                                        <Image
                                            src={item.preview || item.imageData}
                                            alt={item.prompt || 'Library image'}
                                            className="w-full aspect-auto object-contain bg-slate-900 max-h-32"
                                            width={200}
                                            height={200}
                                        />

                                        {/* Category icon - always visible */}
                                        <div className="absolute bottom-1 right-1 bg-black/80 rounded p-1">
                                            {item.category === 'people' && <Users className="w-3 h-3 text-blue-400" />}
                                            {item.category === 'places' && <MapPin className="w-3 h-3 text-green-400" />}
                                            {item.category === 'props' && <Package className="w-3 h-3 text-orange-400" />}
                                            {(!item.category || item.category === 'unorganized') && <ImageIcon className="w-3 h-3 text-slate-400" />}
                                        </div>

                                        {/* Hover overlay with actions */}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-8 w-8 p-0 text-white hover:bg-white/20"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setFullscreenImage(item)
                                                }}
                                            >
                                                <Maximize2 className="w-4 h-4" />
                                            </Button>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-8 w-8 p-0 text-white hover:bg-blue-500 bg-blue-600/80"
                                                        onClick={(e) => e.stopPropagation()}
                                                        title="Edit Category"
                                                    >
                                                        <Edit3 className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <DropdownMenuItem
                                                        onSelect={() => onCategoryChange(item.id, 'people')}
                                                    >
                                                        <Users className="w-4 h-4 mr-2" />
                                                        People
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onSelect={() => onCategoryChange(item.id, 'places')}
                                                    >
                                                        <MapPin className="w-4 h-4 mr-2" />
                                                        Places
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onSelect={() => onCategoryChange(item.id, 'props')}
                                                    >
                                                        <Package className="w-4 h-4 mr-2" />
                                                        Props
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onSelect={() => onCategoryChange(item.id, 'unorganized')}
                                                    >
                                                        <ImageIcon className="w-4 h-4 mr-2" />
                                                        Unorganized
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>

                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-8 w-8 p-0 text-white hover:bg-red-500 bg-red-600/80"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    onDeleteItem(item.id)
                                                }}
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>

                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                )}
            </CardContent>
        </Card>
    )
}

export default ShotReferenceLibrary