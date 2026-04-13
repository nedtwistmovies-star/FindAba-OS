import { supabase } from '../lib/supabaseClient';

export async function registerBusiness({
  name,
  email,
  user_id,
}: {
  name: string;
  email: string;
  user_id: string;
}) {
  try {
    const { data, error } = await supabase.rpc('register_business', {
      p_name: name,
      p_email: email,
      p_user_id: user_id,
    });

    if (error) {
      return {
        success: false,
        message: 'Registration failed. Please try again.',
      };
    }

    return data; // comes directly from SQL function
  } catch (err) {
    return {
      success: false,
      message: 'Unexpected error occurred.',
    };
  }
}
 
