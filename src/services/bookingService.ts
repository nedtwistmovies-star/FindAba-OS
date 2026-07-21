// Canonical bookingService.ts (merged richer implementation)
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
  const client = supabase;
  if (!client) throw new Error('Supabase client not configured');

  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();

  if (userError || !user) throw new Error('User not authenticated');

  // Fetch room price (source of truth)
  const { data: room, error: roomError } = await client
    .from('rooms')
    .select('price')
    .eq('id', roomId)
    .single();

  if (roomError) throw roomError;

  const totalAmount = room.price;

  // Create booking
  const { data: booking, error } = await client
    .from('bookings')
    .insert({
      user_id: user.id,
      room_id: roomId,
      check_in: checkIn,
      check_out: checkOut,
      total_amount: totalAmount,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;

  return booking;
}
