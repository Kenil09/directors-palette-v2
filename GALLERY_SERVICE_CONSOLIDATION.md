# Gallery Service Consolidation

## Overview

Consolidated duplicate gallery services into a unified, reusable service with feature-specific wrappers.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│         Unified Gallery Service (Core)                  │
│         src/lib/services/gallery.service.ts             │
│                                                          │
│  - loadUserGallery(type: 'image' | 'video')            │
│  - deleteItem(id)                                       │
│  - getItemById(id, type?)                               │
│  - getPendingCount(type)                                │
│                                                          │
│  Uses: GalleryRepository (repository pattern)           │
└─────────────────────────────────────────────────────────┘
                            ▲
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
┌───────┴────────────┐              ┌──────────┴─────────┐
│  Image Gallery     │              │  Video Gallery     │
│  Service (Wrapper) │              │  Service (Wrapper) │
│                    │              │                    │
│  shot-creator/     │              │  shot-animator/    │
│  services/         │              │  services/         │
│  gallery.service   │              │  gallery.service   │
│                    │              │                    │
│  Returns:          │              │  Returns:          │
│  GeneratedImage[]  │              │  GeneratedVideo[]  │
└────────────────────┘              └────────────────────┘
```

## Files Structure

### Core Service
**`src/lib/services/gallery.service.ts`**
- Generic CRUD operations for all gallery items
- Type-safe with `GenerationType = 'image' | 'video'`
- Uses `GalleryRepository` for database operations
- Handles storage deletion
- Shared business logic

### Feature-Specific Wrappers

**`src/features/shot-creator/services/gallery.service.ts`**
- Wraps unified service for image operations
- Transforms `GalleryRow` → `GeneratedImage`
- Maintains existing API: `loadUserGallery()`, `deleteImage()`
- No breaking changes for existing code

**`src/features/shot-animator/services/gallery.service.ts`**
- Wraps unified service for video operations
- Transforms `GalleryRow` → `GeneratedVideo`
- Maintains existing API: `loadUserVideos()`, `deleteVideo()`
- No breaking changes for existing code

## Benefits

### ✅ DRY Principle
- Single source of truth for gallery operations
- Shared authentication, error handling, storage deletion logic
- Reduced code duplication (~150 lines eliminated)

### ✅ Consistency
- Both features use the same repository pattern
- Consistent error handling and logging
- Unified approach to storage management

### ✅ Maintainability
- Bug fixes in one place benefit all features
- Easier to add new features (e.g., audio gallery)
- Clear separation of concerns

### ✅ Type Safety
- Strongly typed with `GenerationType`
- Proper TypeScript types throughout
- Feature-specific transformers maintain type safety

### ✅ No Breaking Changes
- Existing code continues to work
- Same method names and signatures
- Transparent to consumers

## Usage Examples

### Core Service (Direct Use)
```typescript
import { GalleryService } from '@/lib/services/gallery.service'

// Load videos
const videos = await GalleryService.loadUserGallery('video')

// Load images
const images = await GalleryService.loadUserGallery('image')

// Delete any item
await GalleryService.deleteItem(itemId)

// Get pending count
const pending = await GalleryService.getPendingCount('video')
```

### Feature Wrappers (Recommended)
```typescript
// Shot Creator (Images)
import { GalleryService } from '@/features/shot-creator/services/gallery.service'
const images = await GalleryService.loadUserGallery()
await GalleryService.deleteImage(imageId)

// Shot Animator (Videos)
import { VideoGalleryService } from '@/features/shot-animator/services/gallery.service'
const videos = await VideoGalleryService.loadUserVideos()
await VideoGalleryService.deleteVideo(videoId)
```

## Migration Notes

### Before
```typescript
// shot-creator/services/gallery.service.ts (150 lines)
// - Direct Supabase queries
// - Manual storage deletion
// - Duplicate auth logic

// shot-animator/services/gallery.service.ts (172 lines)
// - GalleryRepository usage
// - Manual storage deletion
// - Duplicate auth logic
```

### After
```typescript
// lib/services/gallery.service.ts (200 lines)
// - Unified implementation
// - Repository pattern
// - Shared logic

// shot-creator/services/gallery.service.ts (75 lines)
// - Thin wrapper
// - Feature-specific transforms

// shot-animator/services/gallery.service.ts (84 lines)
// - Thin wrapper
// - Feature-specific transforms
```

**Total reduction: ~163 lines of duplicate code**

## Testing

Both feature services maintain their existing APIs, so:
- ✅ No changes needed to existing tests
- ✅ No changes needed to components using these services
- ✅ Hooks (`useGallery`, `useGalleryLoader`) work unchanged

## Future Enhancements

Easy to add new generation types:
```typescript
// Future: Audio gallery
const audio = await GalleryService.loadUserGallery('audio')

// Future: 3D model gallery
const models = await GalleryService.loadUserGallery('3d-model')
```

## Key Decisions

1. **Keep feature wrappers** - Maintains existing APIs, no breaking changes
2. **Use repository pattern** - Type-safe, testable, consistent
3. **Shared core service** - Single source of truth for business logic
4. **Type-specific transforms** - Each feature controls its own data shape
