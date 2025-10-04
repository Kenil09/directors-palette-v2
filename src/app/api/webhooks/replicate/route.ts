import { NextRequest, NextResponse } from 'next/server';
// import { createHmac, timingSafeEqual } from 'crypto';
import { WebhookService } from '@/features/generation/services/webhook.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    // const webhookId = request.headers.get('webhook-id');
    // const webhookTimestamp = request.headers.get('webhook-timestamp');
    // const webhookSignature = request.headers.get('webhook-signature');

    // if (!webhookId || !webhookTimestamp || !webhookSignature) {
    //   return NextResponse.json(
    //     { error: 'Missing webhook headers' },
    //     { status: 400 }
    //   );
    // }

    // // Verify timestamp (prevent replay attacks - 5 min tolerance)
    // const timestamp = parseInt(webhookTimestamp);
    // const now = Math.floor(Date.now() / 1000);
    // if (Math.abs(now - timestamp) > 300) {
    //   return NextResponse.json(
    //     { error: 'Webhook timestamp too old' },
    //     { status: 400 }
    //   );
    // }

    // Get webhook signing secret from Replicate
    // const signingSecret = await WebhookService.getReplicateWebhookSecret();

    // Construct signed content: webhook_id.timestamp.body
    // const signedContent = `${webhookId}.${webhookTimestamp}.${body}`;

    // Generate expected signature
    // const expectedSignature = createHmac('sha256', signingSecret)
    //   .update(signedContent)
    //   .digest('base64');

    // Verify signature (webhook-signature can contain multiple signatures separated by space)
    // const signatures = webhookSignature.split(' ');
    // const isValid = signatures.some(sig => {
    //   try {
    //     return timingSafeEqual(
    //       Buffer.from(sig),
    //       Buffer.from(expectedSignature)
    //     );
    //   } catch {
    //     return false;
    //   }
    // });

    // if (!isValid) {
    //   return NextResponse.json(
    //     { error: 'Invalid webhook signature' },
    //     { status: 401 }
    //   );
    // }

    // Parse event
    const event = JSON.parse(body);
    console.log(`Webhook received for prediction ${event.id}: ${event.status}`);

    // Process the prediction
    await WebhookService.processCompletedPrediction(event);

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}