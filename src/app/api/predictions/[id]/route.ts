import { NextResponse } from 'next/server';
import Replicate from 'replicate';
import { ReplicatePrediction, WebhookService } from '@/features/generation/services/webhook.service';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log(request)
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Prediction ID is required' },
        { status: 400 }
      );
    }

    const prediction = await replicate.predictions.get(id);

    // If prediction succeeded and has output, process it (download and save to Supabase)
    if (prediction.status === 'succeeded' && prediction.output) {
      try {
        await WebhookService.processCompletedPrediction(prediction as unknown as ReplicatePrediction);
      } catch (processError) {
        console.error('Error processing prediction:', processError);
      }
    }

    return NextResponse.json({
      id: prediction.id,
      status: prediction.status,
      output: prediction.output,
      error: prediction.error,
      metrics: prediction.metrics,
      input: prediction.input,
      created_at: prediction.created_at,
      completed_at: prediction.completed_at,
    });

  } catch (error) {
    console.error('Prediction fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prediction status' },
      { status: 500 }
    );
  }
}