
import { logTransaction, activatePlanFeatures } from './supabaseService';
import { triggerWebhook, WebhookEvent } from './webhookService';

const PAYSTACK_KEY_STORAGE = 'findaba_paystack_public_key';
const PAYSTACK_HANDSHAKE_STATUS = 'findaba_paystack_handshake_confirmed';

/**
 * PAYSTACK INDUSTRIAL SETTLEMENT SERVICE v7.0
 * Official Partner Interface for SANDALSroyalle Registry
 */
export const paymentService = {
  getApiKey: () => {
    const local = localStorage.getItem(PAYSTACK_KEY_STORAGE);
    if (local) return local;
    const envKey = (typeof process !== 'undefined' && process.env) ? process.env.PAYSTACK_PUBLIC_KEY : '';
    return import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || envKey || '';
  },
  
  setApiKey: (key: string) => {
    const cleaned = key.trim();
    if (cleaned.startsWith('pk_live_') || cleaned.startsWith('pk_test_')) {
      localStorage.setItem(PAYSTACK_KEY_STORAGE, cleaned);
      return true;
    }
    return false;
  },

  getWebhookUrl: () => {
    return `${window.location.origin}/api/paystack-webhook`;
  },

  isLive: () => {
    const key = localStorage.getItem(PAYSTACK_KEY_STORAGE);
    return key && key.startsWith('pk_live_');
  },

  hasKey: () => {
    const key = localStorage.getItem(PAYSTACK_KEY_STORAGE);
    return !!key && key.length > 20;
  },

  confirmHandshake: () => {
    localStorage.setItem(PAYSTACK_HANDSHAKE_STATUS, 'true');
  },

  isHandshakeConfirmed: () => {
    return localStorage.getItem(PAYSTACK_HANDSHAKE_STATUS) === 'true';
  },

  getPaystackConfig: (config: { email: string, amount: number, label: string, businessId?: string }) => {
    return {
      key: paymentService.getApiKey(),
      email: config.email,
      amount: config.amount * 100, // Paystack uses kobo
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

    // Trigger Automation Webhook
    triggerWebhook(WebhookEvent.PAYMENT_SUCCESS, { 
      reference: response.reference, 
      amount: config.amount, 
      label: config.label,
      business_id: config.businessId 
    });

    return true;
  },

  /**
   * WEBHOOK SIGNAL SIMULATION (FOR TESTING)
   * Mimics the behavior of a backend receiving a Paystack notification
   */
  simulateWebhookSignal: async (businessId: string, planId: string) => {
    console.debug(`[WEBHOOK] Incoming settlement signal for Biz: ${businessId}, Plan: ${planId}`);
    
    // Simulate a delay for institutional processing
    await new Promise(r => setTimeout(r, 2000));

    try {
      await activatePlanFeatures(businessId, planId);
      console.debug(`[WEBHOOK] Commercial node activation successful.`);
      return true;
    } catch (e) {
      console.error(`[WEBHOOK] Critical failure in activation sequence:`, e);
      return false;
    }
  }
};
