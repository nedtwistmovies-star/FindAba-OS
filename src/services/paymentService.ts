import { logTransaction, activatePlanFeatures } from './supabaseService';
import { triggerWebhook, WebhookEvent } from './webhookService';

const PAYSTACK_KEY_STORAGE = 'findaba_paystack_public_key';
const PAYSTACK_HANDSHAKE_STATUS = 'findaba_paystack_handshake_confirmed';

/**
 * PAYSTACK INDUSTRIAL SETTLEMENT SERVICE v8.0 (Hardened)
 */
export const paymentService = {
  
  /**
   * Resolve API Key (priority: localStorage → env)
   */
  getApiKey: () => {
    const local = localStorage.getItem(PAYSTACK_KEY_STORAGE);
    const env = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '';

    const key = local || env;

    if (!key) {
      console.warn("[Paystack] No API key found");
    }

    return key;
  },

  /**
   * Store valid key
   */
  setApiKey: (key: string) => {
    const cleaned = key.trim();

    if (cleaned.startsWith('pk_live_') || cleaned.startsWith('pk_test_')) {
      localStorage.setItem(PAYSTACK_KEY_STORAGE, cleaned);
      return true;
    }

    console.warn("[Paystack] Invalid key format");
    return false;
  },

  getWebhookUrl: () => {
    return `${window.location.origin}/api/paystack-webhook`;
  },

  isLive: () => {
    const key = paymentService.getApiKey();
    return key.startsWith('pk_live_');
  },

  hasKey: () => {
    const key = paymentService.getApiKey();
    return !!key && key.length > 20;
  },

  confirmHandshake: () => {
    localStorage.setItem(PAYSTACK_HANDSHAKE_STATUS, 'true');
  },

  isHandshakeConfirmed: () => {
    return localStorage.getItem(PAYSTACK_HANDSHAKE_STATUS) === 'true';
  },

  /**
   * Generate Paystack config safely
   */
  getPaystackConfig: (config: { email: string, amount: number, label: string, businessId?: string }) => {
    const key = paymentService.getApiKey();

    if (!key) {
      throw new Error("PAYSTACK API KEY NOT CONFIGURED");
    }

    return {
      key,
      email: config.email,
      amount: config.amount * 100,
      ref: `SIG-PS-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      currency: "NGN",
      metadata: {
        custom_fields: [
          {
            display_name: "Service Type",
            variable_name: "service_type",
            value: config.label
          },
          {
            display_name: "Business ID",
            variable_name: "business_id",
            value: config.businessId || "Registry_Enrollment"
          }
        ]
      }
    };
  },

  /**
   * Verify + log transaction
   */
  verifyAndLog: async (response: any, config: any) => {
    if (!response || response.status !== 'success') return false;

    await logTransaction({
      business_id: config.businessId || "FindAba_Hub",
      item_name: config.label || "Industrial Service",
      amount: config.amount,
      reference: response.reference,
      gateway: 'paystack',
      type: 'settlement_verified',
      mode: paymentService.isLive() ? 'live' : 'simulation',
      status: 'success',
      timestamp: new Date().toISOString()
    });

    await triggerWebhook(WebhookEvent.PAYMENT_SUCCESS, { 
      reference: response.reference, 
      amount: config.amount, 
      label: config.label,
      business_id: config.businessId 
    });

    return true;
  },

  /**
   * Simulated webhook (dev/testing only)
   */
  simulateWebhookSignal: async (businessId: string, planId: string) => {
    console.debug(`[WEBHOOK] Incoming settlement signal for Biz: ${businessId}, Plan: ${planId}`);
    
    await new Promise(r => setTimeout(r, 2000));

    try {
      await activatePlanFeatures(businessId, planId);
      console.debug(`[WEBHOOK] Activation successful`);
      return true;
    } catch (e) {
      console.error(`[WEBHOOK] Activation failed:`, e);
      return false;
    }
  }
};