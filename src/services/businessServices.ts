export async function registerBusiness({
  name,
  email,
  user_id,
}: {
  name: string;
  email: string;
  user_id: string;
}) {
  const { data, error } = await supabase
    .from('businesses')
    .upsert(
      { name, email, user_id },
      { onConflict: 'email' }
    )
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return {
        success: false,
        message: 'Business already exists. Please log in.',
      };
    }

    return {
      success: false,
      message: 'Unable to complete registration.',
      error,
    };
  }

  return { success: true, data };
}
