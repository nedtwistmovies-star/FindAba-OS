import { supabase } from '../lib/supabaseClient';

export async function processDeposit({
  businessId,
  walletId,
  amount,
  reference,
}: {
  businessId: string;
  walletId: string;
  amount: number;
  reference: string;
}) {
  const { error } = await supabase.rpc('process_deposit', {
    p_business_id: businessId,
    p_wallet_id: walletId,
    p_amount: amount,
    p_reference: reference,
  });

  if (error) {
    return {
      success: false,
      message: 'Deposit failed. Please contact support.',
    };
  }

  return {
    success: true,
  };
}
