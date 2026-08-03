import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { reference, bookingId } = req.body || {};
    if (!reference) return res.status(400).json({ error: 'Missing reference' });

    if (!process.env.PAYSTACK_SECRET_KEY) {
      return res.status(500).json({ error: 'PAYSTACK_SECRET_KEY not configured' });
    }
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({ error: 'Supabase not configured on server' });
    }

    // Verify with Paystack
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    });

    const data = await verifyRes.json();
    if (!data || !data.data || data.data.status !== 'success') {
      return res.status(400).json({ error: 'Payment not verified', details: data });
    }

    const amount = (data.data.amount || 0) / 100;

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    // Record payment
    const { error: insertError } = await supabase.from('payments').insert({
      user_id: data.data.metadata?.user_id || null,
      booking_id: bookingId || null,
      amount,
      status: 'success',
      reference,
      provider: 'paystack',
    });

    if (insertError) {
      console.error('[api/verify-payment] Supabase insert failed:', insertError);
      return res.status(500).json({ error: 'Failed to record payment', details: insertError.message });
    }

    if (bookingId) {
      const { error: updateError } = await supabase.from('bookings').update({ status: 'confirmed' }).eq('id', bookingId);
      if (updateError) {
        console.error('[api/verify-payment] Booking update failed:', updateError);
        return res.status(500).json({ error: 'Failed to update booking', details: updateError.message });
      }
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[api/verify-payment] Error:', err);
    res.status(500).json({ error: err?.message || String(err) });
  }
}
