import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../../../../supabase/database.types';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const {
      prompt,
      image,
      duration = 5,
      resolution = '720p',
      aspectRatio,
      user_id,
    } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }

    // Prepare input for Replicate
    const input: Record<string, string | number> = {
      prompt,
      duration,
      resolution,
    };

    if (image) {
      input.image = image;
    }

    if (aspectRatio) {
      input.aspect_ratio = aspectRatio;
    }

    // Create Replicate prediction with webhook
    const webhookUrl = `${process.env.WEBHOOK_URL}/api/webhooks/replicate`;
    const prediction = await replicate.predictions.create({
      model: 'bytedance/seedance-1-lite',
      input,
      webhook: webhookUrl,
      webhook_events_filter: ['completed'],
    });

    // Create gallery entry with proper schema
    const { data: gallery, error: galleryError } = await supabase
      .from('gallery')
      .insert({
        user_id,
        prediction_id: prediction.id,
        generation_type: 'video',
        status: 'pending',
        metadata: {
          prompt,
          model: 'bytedance/seedance-1-lite',
          duration,
          resolution,
          aspect_ratio: aspectRatio,
        },
      })
      .select()
      .single();

    if (galleryError || !gallery) {
      console.error('Gallery creation error:', galleryError);
      return NextResponse.json(
        { error: 'Failed to create gallery entry' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      predictionId: prediction.id,
      galleryId: gallery.id,
      status: prediction.status,
    });

  } catch (error) {
    console.error('Video generation error:', error);
    return NextResponse.json(
      { error: 'Failed to create video generation prediction' },
      { status: 500 }
    );
  }
}
