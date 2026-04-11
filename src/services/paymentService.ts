import { logTransaction, activatePlanFeatures } from './yourExistingPath';
import { triggerWebhook, WebhookEvent } from './yourExistingPath';
import { supabase } from '../lib/supabaseClient';

const PAYSTACK_KEY_STORAGE = 'findaba_paystack_key';
const PAYSTACK_HANDSHAKE_STATUS = 'findaba_paystack_status';

/**
 * PAYSTACK INDUSTRIAL SETTLEMENT SERVICE v7.0
 * Official Partner Interface
 */

export const paymentService = {
  getApiKey: () => {
    const local = localStorage.getItem(PAYSTACK_KEY_STORAGE);
    if (local) return local;
    return import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
  },

  setApiKey: (key: string) => {
    const cleaned = key.trim();
    if (cleaned.startsWith('pk_live_') || cleaned.startsWith('pk_test_')) {
      localStorage.setItem(PAYSTACK_KEY_STORAGE, cleaned);
      return true;
    }
    return false;
  },

  // ✅ ADDED FUNCTION
  recordPayment: async ({
    bookingId,
    amount,
    provider = 'paystack',
  }: {
    bookingId: string;
    amount: number;
    provider?: string;
  }) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('User not authenticated');

    // Insert payment
    const { data: payment, error } = await supabase
      .from('payments')
      .insert({
        user_id: user.id,
        booking_id: bookingId,
        amount,
        status: 'success',
        provider,
      })
      .select()
      .single();

    if (error) throw error;

    // Update booking
    await supabase
      .from('bookings')
      .update({ status: 'confirmed' })
      .eq('id', bookingId);

    return payment;
  },

  // (your other existing functions continue below...)
};    // Simulate a delay for institutional processing
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
