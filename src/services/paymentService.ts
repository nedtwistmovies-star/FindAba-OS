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
    const local = typeof window !== 'undefined' ? localStorage.getItem(PAYSTACK_KEY_STORAGE) : null;
    if (local) return local;
    return typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string)
      ? (import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string)
      : (typeof process !== 'undefined' && process.env ? (process.env.PAYSTACK_PUBLIC_KEY || '') : '');
  },
  
  setApiKey: (key: string) => {
    const cleaned = key.trim();
    if (typeof window !== 'undefined' && (cleaned.startsWith('pk_live_') || cleaned.startsWith('pk_test_'))) {
      localStorage.setItem(PAYSTACK_KEY_STORAGE, cleaned);
      return true;
    }
    return false;
  },

  getWebhookUrl: () => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/api/paystack-webhook`;
  },

  isLive: () => {
    const key = typeof window !== 'undefined' ? localStorage.getItem(PAYSTACK_KEY_STORAGE) : null;
    return !!key && key.startsWith('pk_live_');
  },

  hasKey: () => {
    const key = paymentService.getApiKey();
    return !!key && key.length > 20;
  },

  confirmHandshake: () => {
    if (typeof window !== 'undefined') localStorage.setItem(PAYSTACK_HANDSHAKE_STATUS, 'true');
  },

  isHandshakeConfirmed: () => {
    return typeof window !== 'undefined' && localStorage.getItem(PAYSTACK_HANDSHAKE_STATUS) === 'true';
  },

  getPaystackConfig: (config: { email: string, amount: number, label: string, businessId?: string, userId?: string, bookingId?: string }) => {
    return {
      key: paymentService.getApiKey(),
      email: config.email,
      amount: Math.round(config.amount * 100), // Paystack uses kobo
      ref: `SIG-PS-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      currency: "NGN",
      metadata: {
        user_id: config.userId,
        booking_id: config.bookingId,
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
  }
};

// Client-side helper: opens Paystack inline popup and resolves on success or rejects on cancel/error
export async function payWithPaystack({
  email,
  amount,
  business_id,
  wallet_id,
  bookingId,
}: {
  email: string;
  amount: number;
  business_id?: string;
  wallet_id?: string;
  bookingId?: string;
}) {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('Paystack can only be invoked in browser environment'));

    // Ensure Paystack script is loaded
    if (!(window as any).PaystackPop) {
      return reject(new Error('Paystack SDK not loaded'));
    }

    const config = paymentService.getPaystackConfig({ email, amount, label: 'Payment', businessId: business_id, bookingId, userId: undefined });
    const handler = (window as any).PaystackPop.setup({
      ...config,
      metadata: { ...(config.metadata || {}), business_id, wallet_id },
      callback: function (response: any) {
        try {
          const reference = response.reference;
          resolve({ status: 'success', reference });
        } catch (e) {
          reject(e);
        }
      },
      onClose: function () {
        reject(new Error('Payment window closed'));
      }
    });

    try {
      handler.openIframe();
    } catch (e) {
      reject(e);
    }
  });
}
