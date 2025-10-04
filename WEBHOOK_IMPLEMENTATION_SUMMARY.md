# Webhook Implementation Summary

## ✅ Completed Implementation

All planned changes have been successfully implemented for the Replicate webhook integration.

---

## 📦 Files Created

### 1. **Webhook Verification Service**
**File:** `src/features/generation/services/webhook-verification.service.ts`

**Features:**
- Fetches and caches Replicate webhook signing secret
- Verifies HMAC-SHA256 signatures using timing-safe comparison
- Validates timestamps to prevent replay attacks (5-minute tolerance)
- Handles multiple signature formats from webhook headers

**Key Methods:**
- `getSigningSecret()` - Fetches secret from Replicate API (cached)
- `verifySignature()` - Verifies webhook signature
- `isTimestampValid()` - Validates timestamp for replay attack prevention

---

### 2. **Storage Service**
**File:** `src/features/generation/services/storage.service.ts`

**Features:**
- Downloads assets from Replicate temporary URLs
- Uploads to Supabase Storage bucket `directors-palette`
- Auto-detects MIME types and file extensions
- Generates permanent public URLs

**Key Methods:**
- `downloadAsset()` - Downloads from Replicate URL
- `uploadToStorage()` - Uploads to Supabase Storage
- `getMimeType()` - Determines file extension and MIME type

**Storage Path Pattern:** `generations/{user_id}/{prediction_id}.{ext}`

---

## 🔄 Files Modified

### 3. **Webhook Service (Refactored)**
**File:** `src/features/generation/services/webhook.service.ts`

**Changes:**
- ✅ Reduced from 258 lines to ~195 lines (cleaner, more focused)
- ✅ Removed download/upload logic (moved to StorageService)
- ✅ Removed signature verification (moved to WebhookVerificationService)
- ✅ Now uses proper database schema fields:
  - `status` enum: 'pending' | 'processing' | 'completed' | 'failed' | 'canceled'
  - `error_message` field for errors (not metadata)
  - `generation_type` field
- ✅ Organized into clear private methods:
  - `handleSuccessfulPrediction()`
  - `updateGalleryWithError()`
  - `updateGalleryStatus()`

---

### 4. **Webhook Route**
**File:** `src/app/api/webhooks/replicate/route.ts`

**Changes:**
- ✅ Uncommented all signature verification code
- ✅ Implemented proper verification flow:
  1. Extract headers (webhook-id, webhook-timestamp, webhook-signature)
  2. Validate timestamp (prevent replay attacks)
  3. Get signing secret from Replicate
  4. Verify signature using HMAC-SHA256
  5. Process prediction event
  6. Return quick response to Replicate
- ✅ Uses new WebhookVerificationService
- ✅ Proper error handling and logging

---

### 5. **Gallery Repository**
**File:** `src/lib/db/repositories/gallery.repository.ts`

**Changes:**
- ✅ Added `findByPredictionId()` - Find gallery by prediction_id
- ✅ Added `updateByPredictionId()` - Update gallery by prediction_id
- Both methods follow existing repository pattern with proper error handling

---

### 6. **Image Generation API**
**File:** `src/app/api/generation/image/route.ts`

**Changes:**
- ✅ Added `generation_type: 'image'` field
- ✅ Added `status: 'pending'` field
- ✅ Cleaned up metadata structure (only essential data)
- ✅ Proper TypeScript typing with Database types
- ✅ Uses consistent webhook URL from `WEBHOOK_URL` env var

**Gallery Insert Structure:**
```typescript
{
  user_id,
  prediction_id,
  generation_type: 'image',
  status: 'pending',
  metadata: {
    prompt,
    model: 'google/nano-banana',
    output_format: format,
    reference_images: referenceImages || []
  }
}
```

---

### 7. **Video Generation API**
**File:** `src/app/api/generation/video/route.ts`

**Changes:**
- ✅ Removed non-existent `replicate_input` field
- ✅ Added `generation_type: 'video'` field
- ✅ Added `status: 'pending'` field
- ✅ Fixed webhook URL (was using `NEXT_PUBLIC_APP_URL`, now uses `WEBHOOK_URL`)
- ✅ Stores input data in metadata as JSON
- ✅ Proper TypeScript typing with Database types

**Gallery Insert Structure:**
```typescript
{
  user_id,
  prediction_id,
  generation_type: 'video',
  status: 'pending',
  metadata: {
    prompt,
    model: 'bytedance/seedance-1-lite',
    duration,
    resolution,
    aspect_ratio,
    seed_image
  }
}
```

---

## 🔄 Complete Flow

### 1. **Image/Video Generation Request**
```
Frontend → POST /api/generation/image (or /video)
  ├─ Validate input
  ├─ Create Replicate prediction with webhook URL
  ├─ Insert gallery record:
  │  ├─ prediction_id: "abc123"
  │  ├─ status: "pending"
  │  ├─ generation_type: "image" or "video"
  │  └─ metadata: { prompt, model, ... }
  └─ Return { predictionId, galleryId, status }
```

### 2. **Webhook Processing (When Complete)**
```
Replicate → POST /api/webhooks/replicate
  ├─ Extract headers (webhook-id, timestamp, signature)
  ├─ Validate timestamp (5-min window)
  ├─ Verify HMAC-SHA256 signature ✅
  ├─ Parse prediction payload
  └─ WebhookService.processCompletedPrediction():
      │
      ├─ IF status = 'succeeded':
      │  ├─ Download asset from Replicate URL
      │  ├─ Upload to Supabase Storage
      │  └─ Update gallery:
      │     ├─ status: "completed"
      │     ├─ storage_path: "generations/{user_id}/{prediction_id}.jpg"
      │     ├─ public_url: "https://...supabase.co/storage/..."
      │     ├─ file_size: bytes
      │     ├─ mime_type: "image/jpeg"
      │     └─ metadata.completed_at
      │
      ├─ IF status = 'failed':
      │  └─ Update gallery:
      │     ├─ status: "failed"
      │     └─ error_message: "Error from Replicate"
      │
      └─ IF status = 'canceled':
         └─ Update gallery:
            ├─ status: "canceled"
            └─ error_message: "Prediction was canceled"
```

### 3. **Frontend Retrieval**
```
Frontend polls or queries gallery
  └─ Receives permanent URLs from Supabase Storage
  └─ Displays images/videos with status
```

---

## 🔐 Security Features

### ✅ Webhook Signature Verification
- Uses HMAC-SHA256 algorithm
- Timing-safe comparison to prevent timing attacks
- Fetches signing secret from Replicate API
- Caches secret in memory for performance

### ✅ Replay Attack Prevention
- Validates timestamp is within 5 minutes
- Rejects old webhook requests

### ✅ Proper Error Handling
- All services have try-catch blocks
- Errors logged to console
- Failed predictions marked in database
- No sensitive data in error messages

---

## 📊 Database Schema Usage

### Gallery Table Fields:
```typescript
{
  id: UUID (auto)
  user_id: UUID (required)
  prediction_id: string (required, unique)
  generation_type: 'image' | 'video' (required)
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'canceled' (required)
  storage_path: string | null
  public_url: string | null
  file_size: number | null
  mime_type: string | null
  error_message: string | null
  metadata: JSON | null
  created_at: timestamp (auto)
  updated_at: timestamp (auto)
}
```

---

## 🧪 Testing Checklist

### Local Testing (with ngrok):
```bash
# 1. Start ngrok
npx ngrok http 3000

# 2. Update .env.local with ngrok URL
WEBHOOK_URL=https://your-ngrok-url.ngrok-free.app

# 3. Test image generation
curl -X POST http://localhost:3000/api/generation/image \
  -H "Content-Type: application/json" \
  -d '{"prompt": "A cat", "user_id": "user-uuid", "format": "jpg"}'

# 4. Monitor webhook endpoint
# Watch for webhook POST in terminal
```

### Production Testing:
- ✅ Signature verification enabled
- ✅ Proper WEBHOOK_URL in production env
- ✅ Supabase Storage bucket permissions configured
- ✅ Error monitoring set up

---

## 🎉 Summary

**Total Files Created:** 2
- `webhook-verification.service.ts`
- `storage.service.ts`

**Total Files Modified:** 5
- `webhook.service.ts` (refactored, reduced size)
- `route.ts` (webhook endpoint)
- `gallery.repository.ts` (added helper methods)
- `image/route.ts` (fixed schema usage)
- `video/route.ts` (fixed schema usage, webhook URL)

**Code Quality:**
- ✅ Separation of concerns
- ✅ Type safety with TypeScript
- ✅ Proper error handling
- ✅ Security best practices
- ✅ Clean, maintainable code
- ✅ Follows Replicate documentation exactly

**Implementation Status:** 100% Complete ✅
