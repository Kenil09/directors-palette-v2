# Comprehensive Replicate Integration Plan for Directors Palette

## **Architecture Overview**

### **Core Services Structure:**
```
src/features/generation/
├── services/
│   ├── replicate.service.ts         # Core Replicate client
│   ├── image-generation.service.ts  # Nano-banana image generation
│   ├── video-generation.service.ts  # Seedance video generation
│   └── prediction.service.ts        # Prediction lifecycle management
├── types/
│   ├── replicate.types.ts          # Replicate-specific types
│   ├── generation.types.ts         # Generation request/response types
│   └── prediction.types.ts         # Prediction status & lifecycle types
└── hooks/
    ├── useImageGeneration.ts       # React hook for image generation
    ├── useVideoGeneration.ts       # React hook for video generation
    └── usePredictionStatus.ts      # Polling & status management
```

## **API Endpoints Required**

### **1. Image Generation API** (`/api/generation/image`)
```typescript
POST /api/generation/image
{
  prompt: string
  referenceImages?: string[]
  format?: 'jpg' | 'png'
}
Response: { predictionId: string }
```

### **2. Video Generation API** (`/api/generation/video`)
```typescript
POST /api/generation/video
{
  prompt: string
  image?: string           // For image-to-video
  duration: 5 | 10
  resolution: '480p' | '720p'
  aspectRatio?: string
}
Response: { predictionId: string }
```

### **3. Prediction Status API** (`/api/predictions/[id]`)
```typescript
GET /api/predictions/[id]
Response: {
  id: string
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled'
  output?: string | string[]
  error?: string
  metrics?: { predict_time: number }
}
```

### **4. Webhook Handler** (`/api/webhooks/replicate`)
```typescript
POST /api/webhooks/replicate
- Validates webhook signature
- Updates prediction status in database
- Triggers real-time updates via WebSocket/SSE
```

## **Prediction Management Strategy**

### **Database Integration:**
```sql
-- Add to existing schema
CREATE TABLE predictions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  replicate_prediction_id TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL, -- 'image' | 'video'
  status TEXT NOT NULL,
  input JSONB NOT NULL,
  output JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
```

### **Polling vs Webhooks:**
- **Development**: Client-side polling every 2-3 seconds
- **Production**: Webhooks + fallback polling
- **Real-time**: WebSocket/Server-Sent Events for instant updates

## **File Handling Strategy**

### **Generated Asset Storage:**
1. **Replicate URLs** (temporary, 1 hour expiry)
2. **Download & Store** in Supabase Storage
3. **Create Gallery Entry** with permanent URLs
4. **Link Prediction** to Gallery via prediction table

### **Upload Flow:**
```typescript
1. User submits generation request
2. Create prediction record in DB
3. Call Replicate API
4. Poll/webhook for completion
5. Download generated assets
6. Upload to Supabase Storage
7. Create gallery entries
8. Update prediction with gallery IDs
```

## **Model-Specific Implementation**

### **Nano-Banana (Image Generation):**
```typescript
const imageGeneration = {
  model: "google/nano-banana",
  input: {
    prompt: string,
    images?: File[],     // Reference images
    output_format: 'jpg' | 'png'
  },
  output: string[]      // Array of image URLs
}
```

### **Seedance-1-Lite (Video Generation):**
```typescript
const videoGeneration = {
  model: "bytedance/seedance-1-lite",
  input: {
    prompt: string,
    image?: File,        // Optional seed image
    duration: 5 | 10,
    resolution: '480p' | '720p',
    aspect_ratio: '16:9' | '4:3' | '1:1'
  },
  output: string        // Single video URL
}
```

## **Error Handling & User Experience**

### **Status States:**
- ⏳ **Queue**: "Your request is in queue..."
- 🔄 **Processing**: "Generating your content..." (with progress if available)
- ✅ **Success**: "Generation complete!" + preview
- ❌ **Failed**: "Generation failed" + retry option
- ⏱️ **Timeout**: "Taking longer than expected" + continue waiting option

### **Retry Logic:**
- Automatic retry for network failures
- User-initiated retry for failed predictions
- Exponential backoff for polling

## **Cost Management**

### **Budget Controls:**
- Track user generation counts
- Implement daily/monthly limits
- Cost estimation before generation
- Queue management during high usage

### **Pricing Integration:**
- **Nano-banana**: ~$0.039/image
- **Seedance**: ~$0.037/second (720p), ~$0.018/second (480p)

## **Development Phases**

### **Phase 1: Core Integration**
1. Replicate SDK setup
2. Basic prediction service
3. Image generation API
4. Simple polling mechanism

### **Phase 2: Advanced Features**
1. Video generation API
2. Webhook implementation
3. Asset storage integration
4. Gallery linking

### **Phase 3: Production Ready**
1. Real-time updates
2. Error recovery
3. Cost monitoring
4. Performance optimization

## **Key Implementation Decisions**

### **Why This Architecture:**
1. **Separation of Concerns**: Each service handles specific model types
2. **Scalability**: Easy to add new models/providers
3. **Type Safety**: Strict TypeScript for all Replicate interactions
4. **User Experience**: Real-time feedback with fallback mechanisms
5. **Cost Control**: Built-in usage tracking and limits

### **Critical Integration Points:**
1. **Gallery Integration**: Generated assets automatically added to user gallery
2. **Reference System**: Generated content can be categorized and tagged
3. **User Management**: All generations tied to authenticated users
4. **Storage Strategy**: Permanent storage with optimized delivery