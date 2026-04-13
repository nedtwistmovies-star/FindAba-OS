import { supabase } from '../lib/supabaseClient';

type RegisterResponse = {
  success: boolean;
  message?: string;
  data?: any;
};

export async function registerBusiness({
  name,
  email,
  user_id,
}: {
  name: string;
  email: string;
  user_id: string;
}): Promise<RegisterResponse> {
  try {
    const { data, error } = await supabase.rpc('register_business', {
      p_name: name,
      p_email: email,
      p_user_id: user_id,
    });

    // 🔴 Network / RPC error
    if (error) {
      return {
        success: false,
        message: 'Registration failed. Please try again.',
      };
    }

    // 🔴 Safety check (VERY IMPORTANT)
    if (!data) {
      return {
        success: false,
        message: 'No response from server.',
      };
    }

    // ✅ Expected structure from SQL function
    return {
      success: data.success,
      message: data.message,
      data: data.data,
    };

  } catch (err) {
    return {
      success: false,
      message: 'Unexpected error occurred.',
    };
  }
}
