
/**
 * MAKE.COM (INTEGROMAT) INDUSTRIAL AUTOMATION SERVICE
 * Connects FindAba Registry events to external automation workflows.
 */

const MAKE_WEBHOOK_URL = import.meta.env.VITE_MAKE_WEBHOOK_URL || process.env.MAKE_WEBHOOK_URL || '';

export enum WebhookEvent {
  NEW_REGISTRATION = 'new_registration',
  NEW_ORDER = 'new_order',
  NEW_SIGNAL = 'new_signal',
  PAYMENT_SUCCESS = 'payment_success',
  DISPUTE_RAISED = 'dispute_raised',
  NEW_BOOKING = 'new_booking',
  RIDE_REQUEST = 'ride_request',
  SIGNAL_INTEREST = 'signal_interest',
  SEARCH_QUERY = 'search_query',
  LOGISTICS_ORDER_CREATED = 'logistics_order_created',
  REFERRAL_SUCCESS = 'referral_success',
  SYSTEM_AUDIT = 'system_audit'
}

interface WebhookOptions {
  retries?: number;
  silent?: boolean;
}

/**
 * MAKE.COM (INTEGROMAT) INDUSTRIAL AUTOMATION SERVICE
 * Connects FindAba Registry events to external automation workflows.
 */
export const triggerWebhook = async (
  event: WebhookEvent, 
  payload: any, 
  options: WebhookOptions = { retries: 2, silent: false }
): Promise<boolean> => {
  const activeWebhookUrl = localStorage.getItem('findaba_make_webhook_url') || MAKE_WEBHOOK_URL;

  if (!activeWebhookUrl) {
    if (!options.silent) {
      console.warn(`[Automation] Webhook trigger skipped: No Webhook URL configured for event: ${event}`);
    }
    return false;
  }

  const executeTrigger = async (attempt: number): Promise<boolean> => {
    try {
      const response = await fetch(activeWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-FindAba-Event': event,
          'X-FindAba-Timestamp': new Date().toISOString()
        },
        body: JSON.stringify({
          event,
          timestamp: new Date().toISOString(),
          app: 'FindAba City OS',
          version: '6.0',
          data: payload
        }),
      });

      if (!response.ok) {
        if (response.status === 410) {
          console.error("[Automation] Webhook URL is 'Gone' (410). Make.com scenario might be deactivated.");
          return false;
        }
        throw new Error(`HTTP ${response.status}`);
      }

      console.debug(`[Automation] Webhook signal sent successfully: ${event}`);
      return true;
    } catch (error) {
      if (attempt < (options.retries || 0)) {
        const delay = Math.pow(2, attempt) * 1000;
        console.warn(`[Automation] Retrying webhook ${event} (Attempt ${attempt + 1}) in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return executeTrigger(attempt + 1);
      }
      
      console.error(`[Automation] Webhook transmission fault for ${event}:`, error);
      return false;
    }
  };

  return executeTrigger(0);
};

/**
 * Validates the connection to the automation gateway.
 */
export const validateAutomationGateway = async (): Promise<{ status: 'working' | 'broken' | 'unconfigured', message: string }> => {
  const url = localStorage.getItem('findaba_make_webhook_url') || MAKE_WEBHOOK_URL;
  
  if (!url) return { status: 'unconfigured', message: 'No Webhook URL detected in environment or local storage.' };
  
  try {
    const success = await triggerWebhook(WebhookEvent.SYSTEM_AUDIT, { status: 'ping' }, { silent: true });
    if (success) return { status: 'working', message: 'Automation gateway is responsive.' };
    return { status: 'broken', message: 'Gateway rejected the audit signal. Check Make.com scenario status.' };
  } catch (e: any) {
    return { status: 'broken', message: e.message || 'Network error during gateway audit.' };
  }
};
