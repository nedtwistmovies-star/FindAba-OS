
import { supabase } from '../lib/supabaseClient';

export async function createBooking({
  roomId,
  checkIn,
  checkOut,
}: {
  roomId: string;
  checkIn: string;
  checkOut: string;
}) {
  // Calculate total amount (mock logic for now or fetch room price)
  const total_amount = 50000; // Example amount in NGN

  const { data, error } = await supabase
    .from('bookings')
    .insert({
      room_id: roomId,
      check_in: checkIn,
      check_out: checkOut,
      total_amount,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
