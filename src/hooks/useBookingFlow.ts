
import { useState } from 'react';
import { createBooking } from '../services/bookingService';
import { payWithPaystack } from '../services/paymentService';
import { supabase } from '../lib/supabaseClient';
import { triggerWebhook, WebhookEvent } from '../services/webhookService';

export function useBookingFlow() {
  const [loading, setLoading] = useState(false);

  async function bookAndPay({
    roomId,
    checkIn,
    checkOut,
  }: {
    roomId: string;
    checkIn: string;
    checkOut: string;
  }) {
    setLoading(true);

    try {
      const booking = await createBooking({
        roomId,
        checkIn,
        checkOut,
      });

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) throw new Error('User email missing');

      await payWithPaystack({
        email: user.email,
        amount: booking.total_amount,
        onSuccess: async (reference) => {
          await supabase.from('payments').insert({
            booking_id: booking.id,
            user_id: user.id,
            amount: booking.total_amount,
            reference,
            status: 'success',
          });

          const { data: confirmedBooking } = await supabase
            .from('bookings')
            .update({ status: 'confirmed' })
            .eq('id', booking.id)
            .select()
            .single();

          if (confirmedBooking) {
            triggerWebhook(WebhookEvent.NEW_BOOKING, confirmedBooking);
            
            // ✅ Meta WhatsApp Order Notification
            if (user?.user_metadata?.phone || user?.phone) {
              const userPhone = user.user_metadata?.phone || user.phone;
              try {
                await fetch('/api/whatsapp/notify', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    phone: userPhone,
                    template: 'order_confirmation_v2', // Production template name
                    parameters: [
                      { type: 'body', parameters: [{ type: 'text', text: confirmedBooking.id }] }
                    ]
                  })
                });
              } catch (waErr) {
                console.error("[WhatsApp Notify] Notification failed:", waErr);
              }
            }
          }
        },
      });

      return booking;
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return { bookAndPay, loading };
}
