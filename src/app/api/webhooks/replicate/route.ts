import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('webhook-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing webhook signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const webhookSecret = process.env.REPLICATE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('REPLICATE_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // Basic signature verification - in production, implement proper HMAC verification
    // const crypto = require('crypto');
    // const isValid = crypto.timingSafeEqual(
    //   Buffer.from(signature),
    //   Buffer.from(`sha256=${crypto.createHmac('sha256', webhookSecret).update(body).digest('hex')}`)
    // );
    const isValid = true; // TODO: Implement proper webhook signature verification

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    const event = JSON.parse(body);
    const { id, status, output, error: predictionError } = event;

    console.log(`Webhook received for prediction ${id}: ${status}`);

    // Here you can add logic to:
    // 1. Update prediction status in your database
    // 2. Download and store generated assets
    // 3. Create gallery entries
    // 4. Send real-time updates to clients

    switch (status) {
      case 'succeeded':
        console.log(`Prediction ${id} completed successfully:`, output);
        // TODO: Handle successful completion
        break;
      case 'failed':
        console.log(`Prediction ${id} failed:`, predictionError);
        // TODO: Handle failure
        break;
      case 'canceled':
        console.log(`Prediction ${id} was canceled`);
        // TODO: Handle cancellation
        break;
      default:
        console.log(`Prediction ${id} status updated to: ${status}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}