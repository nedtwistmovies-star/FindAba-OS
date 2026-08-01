import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) return res.status(500).json({ error: 'PAYSTACK_SECRET_KEY not configured' });

    const signature = req.headers['x-paystack-signature'];
    const computed = crypto.createHmac('sha512', secret).update(JSON.stringify(req.body)).digest('hex');

    if (computed !== signature) return res.status(401).json({ error: 'Invalid signature' });

    const event = req.body;

    if (event.event === 'charge.success') {
      const data = event.data;
      const reference = data.reference;
      const amount = (data.amount || 0) / 100;
      const metadata = data.metadata || {};

      if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error('[api/paystack-webhook] Supabase not configured');
        return res.status(500).json({ error: 'Supabase not configured' });
      }

      const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      });

      try {
        const paymentData = {
          user_id: metadata.user_id || null,
          amount,
          reference,
          status: 'success',
          provider: 'paystack',
          metadata: data,
          created_at: new Date().toISOString(),
        };

        if (metadata.booking_id) paymentData.booking_id = metadata.booking_id;
        if (metadata.order_id) paymentData.order_id = metadata.order_id;

        const { error: paymentError } = await supabase.from('payments').upsert(paymentData, { onConflict: 'reference' });
        if (paymentError) throw paymentError;

        if (paymentData.order_id) {
          await supabase.from('orders').update({ status: 'paid', updated_at: new Date().toISOString() }).eq('id', paymentData.order_id);
        }

        if (paymentData.user_id) {
          const { data: profile, error: profileError } = await supabase.from('profiles').select('tier_level, email, full_name').eq('id', paymentData.user_id).single();
          if (!profileError && profile?.email) {
            // Optionally send email; defer to existing resend/email service if available.
            console.log('[api/paystack-webhook] Payment recorded for user:', profile.email);
          }
        }
      } catch (dbErr) {
        console.error('[api/paystack-webhook] Processing error:', dbErr);
        return res.status(500).json({ error: 'Internal processing error', details: dbErr.message || String(dbErr) });
      }
    }

    return res.status(200).json({ status: 'success' });
  } catch (err) {
    console.error('[api/paystack-webhook] Fatal:', err);
    res.status(500).json({ error: err?.message || String(err) });
  }
}
