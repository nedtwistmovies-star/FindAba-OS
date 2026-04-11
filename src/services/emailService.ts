
/**
 * FINDABA TRANSACTIONAL EMAIL SERVICE
 * Interface for sending emails via the server-side Resend integration.
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  name?: string;
}

export const sendEmail = async (options: EmailOptions): Promise<{ success: boolean; id?: string; error?: string }> => {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...options,
        from: options.from || 'onboarding@findaba.com.ng',
        name: options.name || 'FindAba City OS'
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to send email' };
    }

    return { success: true, id: data.id };
  } catch (error: any) {
    console.error('[EmailService] Transmission error:', error);
    return { success: false, error: error.message || 'Network error' };
  }
};

/**
 * Sends a welcome email to a new user.
 */
export const sendWelcomeEmail = async (email: string, name: string, referralLink: string) => {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h1 style="color: #004d2c;">Welcome to FindAba City OS, ${name}!</h1>
      <p>We're excited to have you as part of Enyimba's digital backbone.</p>
      <p>Your account has been successfully initialized. You can now explore the registry, consult Kalu AI, and manage your industrial assets.</p>
      
      <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Your Referral Link</h3>
        <p>Share this link to earn rewards when others join the registry:</p>
        <a href="${referralLink}" style="color: #d4af37; font-weight: bold; text-decoration: none;">${referralLink}</a>
      </div>
      
      <p>If you have any questions, simply reply to this email or consult the Oracle in your dashboard.</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="font-size: 12px; color: #888;">FindAba City OS • Smart Logistics & Supply Chain • Aba, Nigeria</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: "Welcome to the FindAba Registry!",
    html,
    name: "FindAba Onboarding"
  });
};
