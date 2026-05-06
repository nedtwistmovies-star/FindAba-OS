
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
  THRIFT_CONTRIBUTION = 'thrift_contribution',
  THRIFT_WITHDRAWAL = 'thrift_withdrawal',
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
  test?: boolean;
  source?: string;
  timestamp?: string;
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
    metadata: data ? sanitizeData(data) : {}
  };
};

/**
 * Ensures data is safe for transmission and not excessively large.
 */
const sanitizeData = (data: any): any => {
  if (!data) return {};
  
  // Create a shallow copy to avoid mutating original
  const clean: any = Array.isArray(data) ? [...data] : { ...data };
  
  // Recursively sanitize if needed, but for now we just handle top-level large fields
  for (const key in clean) {
    const val = clean[key];
    
    // Truncate extremely large strings (e.g. base64 images)
    if (typeof val === 'string' && val.length > 3000) {
      clean[key] = val.substring(0, 100) + "... [TRUNCATED DUE TO SIZE]";
    }
    
    // Remove functions or potentially problematic objects
    if (typeof val === 'function') {
      delete clean[key];
    }
  }
  
  return clean;
};

/**
 * Validates if a string is a properly formatted HTTP/HTTPS URL.
 */
const isValidUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (e) {
    return false;
  }
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
  const rawUrl = localStorage.getItem('findaba_make_webhook_url') || MAKE_WEBHOOK_URL;
  const activeWebhookUrl = rawUrl?.trim();

  if (!activeWebhookUrl || !isValidUrl(activeWebhookUrl)) {
    if (!options.silent) {
      console.warn(`[Automation] Webhook trigger skipped: Invalid or missing Webhook URL for event: ${event}. Received: ${activeWebhookUrl?.substring(0, 50)}${activeWebhookUrl && activeWebhookUrl.length > 50 ? '...' : ''}`);
    }
    return false;
  }

  const standardizedData = standardizePayload(event, payload, options);
  const retryDelays = [2000, 5000, 10000]; // 2s, 5s, 10s as per specs

  const executeTrigger = async (attempt: number): Promise<boolean> => {
    let status: 'success' | 'failed' = 'failed';
    let responseText = '';

    try {
      // 🔹 PROXY UPGRADE: Use server-side proxy to avoid browser CORS/Network blocks
      const response = await fetch('/api/automation/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: activeWebhookUrl,
          event: event,
          payload: {
            ...standardizedData,
            app: 'FindAba City OS',
            version: '7.0'
          },
          options: {
            retries: options.retries
          }
        })
      });

      const result = await response.json();
      responseText = JSON.stringify(result);

      if (response.ok) {
        status = 'success';
        console.debug(`[Automation] Webhook signal relayed successfully via proxy: ${event}`);
        await logAutomationEvent(standardizedData, status, responseText);
        return true;
      } else {
        const error: any = new Error(result.error || `HTTP ${response.status}: ${responseText}`);
        error.status = response.status;
        throw error;
      }
    } catch (error: any) {
      const isTerminalError = error.status === 410 || error.status === 404;
      
      if (isTerminalError) {
        console.error(`[Automation] Terminal fault for ${event}: ${error.message}. Scenario is likely inactive or deleted in Make.com.`);
      } else {
        console.error(`[Automation] Webhook transmission fault for ${event} (Attempt ${attempt + 1}):`, error);
      }
      
      if (!isTerminalError && attempt < (options.retries || 3) && attempt < retryDelays.length) {
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
  const url = localStorage.getItem('findaba_make_webhook_url') || MAKE_WEBHOOK_URL || DEFAULT_MAKE_URL;
  
  if (!url) return { status: 'unconfigured', message: 'No Webhook URL detected in environment or local storage.' };
  
  try {
    const success = await triggerWebhook(WebhookEvent.SYSTEM_AUDIT, { status: 'ping' }, { silent: true });
    if (success) return { status: 'working', message: 'Automation gateway is responsive.' };
    
    // If triggerWebhook returned false, it might have been a 410
    return { 
      status: 'failed', 
      message: 'Gateway rejected the audit signal. This usually means your Make.com scenario is either turned OFF or the webhook has been deleted.' 
    };
  } catch (e: any) {
    if (e.message?.includes('410')) {
      return { status: 'failed', message: 'Make.com scenario is inactive (HTTP 410). Please turn on the scenario in your Make.com dashboard.' };
    }
    return { status: 'failed', message: e.message || 'Network error during gateway audit.' };
  }
};

export const validateAutomationGateway = checkMakeAutomation;

/**
 * Returns a sample payload for a given event type to help with Make.com configuration.
 */
export const getSamplePayload = (event: WebhookEvent) => {
  const base = {
    user_id: 'usr_123456',
    email: 'artisan@findaba.com.ng',
    event_type: event,
    amount: 5000,
    reference: 'REF-SAMPLE-999',
    tier_level: 'premium',
    timestamp: new Date().toISOString(),
    app: 'FindAba City OS',
    version: '7.0'
  };

  const specific: Record<string, any> = {
    [WebhookEvent.NEW_REGISTRATION]: {
      name: 'Aba Industrial Hub',
      category: 'Manufacturing',
      location: 'Ariaria Market, Aba',
      verification_level: 'verified'
    },
    [WebhookEvent.PAYMENT_SUCCESS]: {
      order_id: 'ord_789',
      payment_method: 'paystack',
      currency: 'NGN'
    },
    [WebhookEvent.LOGISTICS_ORDER_CREATED]: {
      tracking_id: 'ABA-LOG-123',
      origin: 'Aba',
      destination: 'Lagos',
      carrier: 'FindAba Logistics'
    },
    [WebhookEvent.NEW_SIGNAL]: {
      signal_type: 'procurement',
      requirement: '500 units of leather soles',
      urgency: 'high'
    },
    [WebhookEvent.NEW_BOOKING]: {
      hotel_name: 'FindAba Suites',
      room_type: 'Executive',
      check_in: '2024-05-01',
      check_out: '2024-05-05'
    }
  };

  return {
    ...base,
    metadata: specific[event] || { note: 'Sample data for configuration' }
  };
};
