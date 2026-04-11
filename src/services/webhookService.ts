
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
  user_id?: string;
  email?: string;
  amount?: number;
  reference?: string;
  tier_level?: string;
}

/**
 * Standardizes the payload to ensure critical fields are present.
 */
const standardizePayload = (event: WebhookEvent, data: any, options: WebhookOptions) => {
  return {
    user_id: options.user_id || data.user_id || data.id || 'system',
    email: options.email || data.email || data.user_email || 'system@findaba.com.ng',
    event_type: event,
    amount: options.amount || data.amount || data.total_price || 0,
    reference: options.reference || data.reference || data.id || `REF-${Date.now()}`,
    tier_level: options.tier_level || data.tier_level || data.hub_tier || 'standard',
    timestamp: new Date().toISOString(),
    metadata: data
  };
};

/**
 * MAKE.COM (INTEGROMAT) INDUSTRIAL AUTOMATION SERVICE
 * Connects FindAba Registry events to external automation workflows.
 */
export const triggerWebhook = async (
  event: WebhookEvent, 
  payload: any, 
  options: WebhookOptions = { retries: 3, silent: false }
): Promise<boolean> => {
  const activeWebhookUrl = localStorage.getItem('findaba_make_webhook_url') || MAKE_WEBHOOK_URL;

  if (!activeWebhookUrl) {
    if (!options.silent) {
      console.warn(`[Automation] Webhook trigger skipped: No Webhook URL configured for event: ${event}`);
    }
    return false;
  }

  const standardizedData = standardizePayload(event, payload, options);
  const retryDelays = [2000, 5000, 10000]; // 2s, 5s, 10s as per specs

  const executeTrigger = async (attempt: number): Promise<boolean> => {
    let status: 'success' | 'failed' = 'failed';
    let responseText = '';

    try {
      const response = await fetch(activeWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-FindAba-Event': event,
          'X-FindAba-Timestamp': standardizedData.timestamp,
          'X-FindAba-Attempt': (attempt + 1).toString()
        },
        body: JSON.stringify({
          ...standardizedData,
          app: 'FindAba City OS',
          version: '7.0'
        }),
      });

      responseText = await response.text();

      if (response.ok) {
        status = 'success';
        console.debug(`[Automation] Webhook signal sent successfully: ${event}`);
        await logAutomationEvent(standardizedData, status, responseText);
        return true;
      } else {
        throw new Error(`HTTP ${response.status}: ${responseText}`);
      }
    } catch (error: any) {
      console.error(`[Automation] Webhook transmission fault for ${event} (Attempt ${attempt + 1}):`, error);
      
      if (attempt < (options.retries || 3) && attempt < retryDelays.length) {
        const delay = retryDelays[attempt];
        console.warn(`[Automation] Retrying webhook ${event} in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return executeTrigger(attempt + 1);
      }
      
      await logAutomationEvent(standardizedData, 'failed', error.message || String(error));
      return false;
    }
  };

  return executeTrigger(0);
};

/**
 * Logs automation events to the database for traceability.
 */
async function logAutomationEvent(data: any, status: 'success' | 'failed', response: string) {
  try {
    // We import dynamically to avoid circular dependency
    const { getSupabase } = await import('./supabaseService');
    const sb = getSupabase();
    if (!sb) return;

    await sb.from('automation_logs').insert({
      user_id: data.user_id,
      event_type: data.event_type,
      payload: data,
      status: status,
      response: response,
      created_at: new Date().toISOString()
    });
  } catch (e) {
    console.warn("[Automation] Logging failed (Table might not exist yet):", e);
  }
}

/**
 * Validates the connection to the automation gateway.
 */
export const checkMakeAutomation = async (): Promise<{ status: 'working' | 'failed' | 'unconfigured', message: string }> => {
  const url = localStorage.getItem('findaba_make_webhook_url') || MAKE_WEBHOOK_URL;
  
  if (!url) return { status: 'unconfigured', message: 'No Webhook URL detected in environment or local storage.' };
  
  try {
    const success = await triggerWebhook(WebhookEvent.SYSTEM_AUDIT, { status: 'ping' }, { silent: true });
    if (success) return { status: 'working', message: 'Automation gateway is responsive.' };
    return { status: 'failed', message: 'Gateway rejected the audit signal. Check Make.com scenario status.' };
  } catch (e: any) {
    return { status: 'failed', message: e.message || 'Network error during gateway audit.' };
  }
};

export const validateAutomationGateway = checkMakeAutomation;
