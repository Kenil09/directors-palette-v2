import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Webhook Verification Service
 * Handles Replicate webhook signature verification
 * Based on: https://replicate.com/docs/topics/webhooks/verify-webhook
 */
export class WebhookVerificationService {
  private static signingSecretCache: string | null = null;

  /**
   * Get Replicate webhook signing secret from API (cached)
   * The secret is returned in format "whsec_xxxxx" and we need the base64 part
   * We decode the base64 to get the actual bytes for HMAC
   */
  static async getSigningSecret(): Promise<string> {
    if (this.signingSecretCache) {
      return this.signingSecretCache;
    }

    const response = await fetch(
      'https://api.replicate.com/v1/webhooks/default/secret',
      {
        headers: {
          Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch webhook secret: ${response.status}`);
    }

    const data = await response.json();

    // Extract base64 part after 'whsec_' prefix
    const base64Secret = data.key.replace('whsec_', '');
    this.signingSecretCache = base64Secret;

    return base64Secret;
  }

  /**
   * Verify HMAC-SHA256 signature using timing-safe comparison
   * @param webhookId - The webhook-id header value
   * @param timestamp - The webhook-timestamp header value
   * @param body - The raw request body
   * @param signature - The webhook-signature header value (can contain multiple signatures)
   * @param secret - The signing secret from Replicate
   * @returns true if signature is valid
   */
  static verifySignature(
    webhookId: string,
    timestamp: string,
    body: string,
    signature: string,
    secret: string
  ): boolean {
    // Construct signed content: webhook_id.timestamp.body
    const signedContent = `${webhookId}.${timestamp}.${body}`;

    // Decode the base64 secret to get the actual bytes for HMAC
    const secretBytes = Buffer.from(secret, 'base64');

    // Generate expected signature using HMAC-SHA256
    const expectedSignature = createHmac('sha256', secretBytes)
      .update(signedContent)
      .digest('base64');

    // webhook-signature can contain multiple signatures separated by space
    // Format: "v1,base64sig1 v1,base64sig2"
    const signatures = signature.split(' ');

    // Check if any signature matches (using timing-safe comparison)
    for (const sig of signatures) {
      try {
        // Remove version prefix (e.g., "v1,") if present
        const sigValue = sig.includes(',') ? sig.split(',')[1] : sig;

        // Use timing-safe comparison to prevent timing attacks
        const match = timingSafeEqual(
          Buffer.from(sigValue),
          Buffer.from(expectedSignature)
        );

        if (match) {
          return true;
        }
      } catch {
        // timingSafeEqual throws if buffers have different lengths
        continue;
      }
    }

    return false;
  }

  /**
   * Validate timestamp to prevent replay attacks
   * @param timestamp - The webhook-timestamp header value (seconds since epoch)
   * @returns true if timestamp is within 5 minutes
   */
  static isTimestampValid(timestamp: string): boolean {
    const webhookTimestamp = parseInt(timestamp, 10);
    const currentTimestamp = Math.floor(Date.now() / 1000);

    // Allow 5 minutes (300 seconds) tolerance
    const tolerance = 300;

    return Math.abs(currentTimestamp - webhookTimestamp) <= tolerance;
  }
}
