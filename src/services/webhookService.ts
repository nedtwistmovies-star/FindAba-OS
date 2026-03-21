
/**
 * MAKE.COM (INTEGROMAT) INDUSTRIAL AUTOMATION SERVICE
 * Connects FindAba Registry events to external automation workflows.
 */

const envWebhook = (typeof process !== 'undefined' && process.env) ? process.env.MAKE_WEBHOOK_URL : '';
const MAKE_WEBHOOK_URL = import.meta.env.VITE_MAKE_WEBHOOK_URL || envWebhook || '';

export enum WebhookEvent {
  NEW_REGISTRATION = 'new_registration',
  NEW_ORDER = 'new_order',
  NEW_SIGNAL = 'new_signal',
  PAYMENT_SUCCESS = 'payment_success',
  DISPUTE_RAISED = 'dispute_raised',
  NEW_BOOKING = 'new_booking',
  RIDE_REQUEST = 'ride_request',
  SIGNAL_INTEREST = 'signal_interest'
}

export const triggerWebhook = async (event: WebhookEvent, payload: any) => {
  if (!MAKE_WEBHOOK_URL) {
    console.warn(`[Automation] Webhook trigger skipped: VITE_MAKE_WEBHOOK_URL not configured for event: ${event}`);
    return;
  }

  try {
    const response = await fetch(MAKE_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event,
        timestamp: new Date().toISOString(),
        app: 'FindAba City OS',
        data: payload
      }),
    });

    if (!response.ok) {
      if (response.status === 410) {
        throw new Error("Webhook URL is 'Gone' (410). Please generate a new Webhook URL in Make.com and update your environment variables.");
      }
      throw new Error(`Webhook failed with status: ${response.status}`);
    }

    console.debug(`[Automation] Webhook signal sent successfully: ${event}`);
    return true;
  } catch (error) {
    console.error(`[Automation] Webhook transmission fault:`, error);
    return false;
  }
};
