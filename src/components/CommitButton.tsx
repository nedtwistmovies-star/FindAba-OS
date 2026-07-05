
import React from 'react';
import { useBookingFlow } from '../hooks/useBookingFlow';

interface CommitButtonProps {
  roomId: string;
  checkIn: string;
  checkOut: string;
}

export default function CommitButton({
  roomId,
  checkIn,
  checkOut,
}: CommitButtonProps) {
  const { bookAndPay, loading } = useBookingFlow();

  return (
    <button
      onClick={() =>
        bookAndPay({ roomId, checkIn, checkOut })
      }
      disabled={loading}
      className="w-full bg-aba-deep text-white py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-aba-green transition-standard active:scale-95 disabled:opacity-50"
    >
      {loading ? 'Processing...' : 'CONFIRM BOOKING'}
    </button>
  );
}
