"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Film, ImageIcon, Layout, Sparkles } from "lucide-react";
import { useLayoutStore } from "@/store/layout.store";
import { ShotCreator } from "@/features/shot-creator";

export default function Home() {
  const { activeTab, setActiveTab } = useLayoutStore();
  return (
    <div className="container mx-auto max-w-none w-[95%] p-6 sm:p-4">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
              <Film className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500" />
              <span className="hidden sm:inline">Post Production Studio</span>
              <span className="sm:hidden">Post Production</span>
            </h1>
            <p className="text-slate-400 mt-1 text-sm sm:text-base">
              Advanced image generation with Director`s Palette integration
            </p>
          </div>
        </div>
        {/* Mobile-First Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          {/* Mobile: Dropdown Selector + Primary Tabs */}
          <div className="block sm:hidden">
            <div className="mb-3">
              <Select value={activeTab} onValueChange={setActiveTab}>
                <SelectTrigger className="w-full h-14 text-lg bg-slate-800 border-slate-600 text-white touch-manipulation">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gen4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Shot Creator
                    </div>
                  </SelectItem>
                  <SelectItem value="workspace">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      Shot Animator
                    </div>
                  </SelectItem>
                  <SelectItem value="layout">
                    <div className="flex items-center gap-2">
                      <Layout className="w-4 h-4" />
                      Layout & Annotation
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Desktop: Original Tab Layout */}
          <TabsList className="hidden sm:grid grid-cols-3 w-full max-w-none min-h-[48px] h-auto">
            {/* gen4 */}
            <TabsTrigger value="shot-creator" className="flex items-center gap-2 min-h-[44px]">
              <Sparkles className="w-4 h-4" />
              <span className="hidden lg:inline">Shot Creator</span>
            </TabsTrigger>
            {/* workspace */}
            <TabsTrigger value="shot-animator" className="flex items-center gap-2 min-h-[44px]">
              <ImageIcon className="w-4 h-4" />
              <span className="hidden lg:inline">Shot Animator</span>
            </TabsTrigger>
            {/* layout */}
            <TabsTrigger value="layout-annotation" className="flex items-center gap-2 min-h-[44px]">
              <Layout className="w-4 h-4" />
              <span className="hidden lg:inline">Layout & Annotation</span>
            </TabsTrigger>
          </TabsList>

          {/* Shot Creator Tab - Clean Component with Paste Buttons */}
          <TabsContent value="shot-creator" className="space-y-4">
            <ShotCreator />
          </TabsContent>

          {/* Shot Animator Tab - SeeeDance Video Generation */}
          <TabsContent value="shot-animator" className="space-y-4">
            shot-animator
            {/* <ShotAnimatorTab
              onSendToLibrary={handleSendToLibrary}
              onSendToImageEdit={(imageUrl) => {
                // Convert video frame to image for editing
                console.log('🎞️ Sending video frame to image editor:', imageUrl)
              }}
              libraryItems={libraryItems}
              libraryCategory={libraryCategory}
              setLibraryCategory={setLibraryCategory}
              libraryLoading={libraryLoading}
              onFullscreenImage={setFullscreenImage}
              onCategoryChange={async (itemId: string, newCategory: string) => {
                // TODO: Implement category change functionality
                toast({
                  title: "Category Changed",
                  description: `Item moved to ${newCategory}`
                })
                loadLibraryItems()
              }}
            /> */}
          </TabsContent>

          {/* Complete Layout & Annotation Editor Tab */}
          <TabsContent value="layout-annotation">
            layout-annotation
            {/* <LayoutAnnotationWrapper /> */}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
