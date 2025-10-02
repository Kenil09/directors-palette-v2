import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(request: NextRequest) {
  try {
    const {
      prompt,
      image,
      duration = 5,
      resolution = '720p',
      aspectRatio
    } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

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

    const prediction = await replicate.predictions.create({
      model: 'bytedance/seedance-1-lite',
      input,
    });

    return NextResponse.json({
      predictionId: prediction.id,
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