/**
 * MAKE.COM (INTEGROMAT) INDUSTRIAL AUTOMATION SERVICE
 * Connects FindAba Registry events to external automation workflows.
 */

const MAKE_WEBHOOK_URL =
  import.meta.env.VITE_MAKE_WEBHOOK_URL || '';

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
    console.warn("[Automation] Webhook skipped:", {
      event,
      hasEnv: !!import.meta.env.VITE_MAKE_WEBHOOK_URL
    });
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
        throw new Error("Webhook URL expired (410). Generate a new one in Make.com.");
      }
      throw new Error(`Webhook failed: ${response.status}`);
    }

    console.debug(`[Automation] Webhook sent: ${event}`);
    return true;

  } catch (error) {
    console.error("[Automation] Webhook fault:", error);
    return false;
  }
};