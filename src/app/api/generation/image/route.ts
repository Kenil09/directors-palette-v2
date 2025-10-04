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
    const { prompt, referenceImages, format = 'jpg', user_id } = await request.json();

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
    const input: Record<string, string | string[]> = {
      prompt,
      output_format: format,
    };

    if (referenceImages && referenceImages.length > 0) {
      input.image_input = referenceImages;
    }

    // Create Replicate prediction with webhook
    const webhookUrl = `${process.env.WEBHOOK_URL}/api/webhooks/replicate`;
    const prediction = await replicate.predictions.create({
      model: 'google/nano-banana',
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
        generation_type: 'image',
        status: 'pending',
        metadata: {
          prompt,
          model: 'google/nano-banana',
          output_format: format,
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
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: 'Failed to create image generation prediction' },
      { status: 500 }
    );
  }
}
