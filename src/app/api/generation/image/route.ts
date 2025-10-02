import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(request: NextRequest) {
  try {
    const { prompt, referenceImages, format = 'jpg' } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const input: Record<string, string | string[]> = {
      prompt,
      output_format: format,
    };

    if (referenceImages && referenceImages.length > 0) {
      input.images = referenceImages;
    }

    const prediction = await replicate.predictions.create({
      model: 'google/nano-banana',
      input,
    });

    return NextResponse.json({
      predictionId: prediction.id,
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