# Shot Animator Hooks

## useGallery

A React hook for managing video gallery with real-time updates from Supabase.

### Features

- ✅ Load videos from database (filtered by `generation_type: 'video'`)
- ✅ Real-time updates using Supabase subscriptions
- ✅ Delete videos (removes from both database and storage)
- ✅ Manual refresh capability
- ✅ Automatic error handling
- ✅ Loading states

### Usage

```tsx
import { useGallery } from '@/features/shot-animator/hooks/useGallery'

function MyComponent() {
  const { videos, isLoading, error, deleteVideo, refreshVideos } = useGallery()

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      <button onClick={refreshVideos}>Refresh</button>
      
      {videos.map((video) => (
        <div key={video.id}>
          <video src={video.videoUrl} controls />
          <h3>{video.shotName}</h3>
          <p>Model: {video.model}</p>
          <p>Status: {video.status}</p>
          <button onClick={() => deleteVideo(video.id)}>Delete</button>
        </div>
      ))}
    </div>
  )
}
```

### Return Values

```typescript
interface UseGalleryReturn {
  videos: GeneratedVideo[]        // Array of video objects
  isLoading: boolean              // Loading state
  error: string | null            // Error message if any
  deleteVideo: (id: string) => Promise<boolean>  // Delete a video
  refreshVideos: () => Promise<void>             // Manually refresh
}
```

### Video Object Structure

```typescript
interface GeneratedVideo {
  id: string                      // Gallery entry ID
  videoUrl: string                // Public URL of the video
  thumbnailUrl?: string           // Optional thumbnail
  shotName: string                // Name/prompt of the video
  model: string                   // Model used (seedance-lite/pro)
  createdAt: Date                 // Creation timestamp
  status: 'processing' | 'completed' | 'failed'
  progress?: number               // Optional progress percentage
}
```

### Real-time Updates

The hook automatically subscribes to Supabase real-time changes for the `gallery` table:

- Listens to INSERT, UPDATE, and DELETE events
- Filters by current user's ID
- Automatically reloads videos when changes occur
- Cleans up subscription on unmount

### Error Handling

Errors are caught and exposed through the `error` state:

```tsx
const { error } = useGallery()

if (error) {
  console.error('Gallery error:', error)
}
```

## useVideoGeneration

A React hook for generating videos with automatic file uploads to Replicate.

### Features

- ✅ Upload local files (blob URLs) to Replicate automatically
- ✅ Handle main image, reference images, and last frame image
- ✅ Batch video generation
- ✅ Progress tracking
- ✅ Error handling per shot

### Usage

See existing documentation in the codebase.

---

## Related Services

### VideoGalleryService

Backend service that handles:
- Loading videos from database using `GalleryRepository`
- Deleting videos (database + storage)
- Transforming database rows to `GeneratedVideo` objects

Located at: `src/features/shot-animator/services/gallery.service.ts`

### Example Component

See `VideoGallery.tsx` for a complete example of using the `useGallery` hook.
