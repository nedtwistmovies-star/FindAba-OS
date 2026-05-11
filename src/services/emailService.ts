
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
  apiKey?: string;
}

export const sendEmail = async (options: EmailOptions): Promise<{ success: boolean; id?: string; error?: string }> => {
  try {
    const isServer = typeof window === 'undefined';
    
    // On the server, we don't fetch our own API via relative URL
    // Instead, we just Return a failure or better yet, the server should use Resend directly.
    // However, since we want to share this service, we'll guard it.
    if (isServer) {
      console.warn("[EmailService] sendEmail called on server. This should be handled by Resend directly in server.ts.");
      return { success: false, error: "Server-side fetch not supported in shared service" };
    }

    const response = await fetch(window.location.origin + '/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        ...options,
        from: options.from || 'onboarding@findaba.com.ng',
        name: options.name || 'FindAba City OS',
        apiKey: options.apiKey || localStorage.getItem('findaba_resend_api_key') || undefined
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

/**
 * Sends order received email to customer.
 */
export const sendOrderReceivedEmail = async (email: string, orderId: string, amount: number) => {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #1e293b; border-radius: 10px; background: #0f172a; color: #f8fafc;">
      <h1 style="color: #d4af37; border-bottom: 2px solid #334155; padding-bottom: 10px;">Order Received</h1>
      <p>Hello,</p>
      <p>Your order on <strong>FindAba</strong> has been received and is currently being processed.</p>
      <div style="background: #1e293b; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Order ID:</strong> #${orderId}</p>
        <p style="margin: 5px 0;"><strong>Amount:</strong> ₦${amount.toLocaleString()}</p>
      </div>
      <p>We will notify you once your payment is confirmed and the order is finalized.</p>
      <p style="font-size: 12px; color: #94a3b8; margin-top: 30px;">FindAba City OS • Industrial Signal Secured</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `Order #${orderId} Received on FindAba`,
    html,
    name: "FindAba Sales"
  });
};

/**
 * Sends payment confirmation email to customer.
 */
export const sendPaymentSuccessEmail = async (email: string, reference: string, amount: number) => {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #d4af37; border-radius: 10px; background: #0f172a; color: #f8fafc;">
      <h1 style="color: #22c55e; border-bottom: 2px solid #334155; padding-bottom: 10px;">Payment Successful</h1>
      <p>Excellent news!</p>
      <p>Payment successful. Your order is confirmed and the funds have been secured.</p>
      <div style="background: #1e293b; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Transaction Ref:</strong> ${reference}</p>
        <p style="margin: 5px 0;"><strong>Amount Paid:</strong> ₦${amount.toLocaleString()}</p>
      </div>
      <p>Your industrial assets are now being prepared for fulfillment.</p>
      <p style="font-size: 12px; color: #94a3b8; margin-top: 30px;">FindAba City OS • Financial Handshake Complete</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: "Payment Confirmed - FindAba City OS",
    html,
    name: "FindAba Finance"
  });
};

/**
 * Sends appointment booking confirmation.
 */
export const sendAppointmentEmail = async (email: string, businessName: string, dateTime: string) => {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #3b82f6; border-radius: 10px; background: #0f172a; color: #f8fafc;">
      <h1 style="color: #3b82f6; border-bottom: 2px solid #334155; padding-bottom: 10px;">Appointment Booked</h1>
      <p>Greetings,</p>
      <p>Your appointment has been booked successfully with <strong>${businessName}</strong>.</p>
      <div style="background: #1e293b; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Establishment:</strong> ${businessName}</p>
        <p style="margin: 5px 0;"><strong>Date/Time:</strong> ${dateTime}</p>
      </div>
      <p>Please ensure you arrive on time for your scheduled session.</p>
      <p style="font-size: 12px; color: #94a3b8; margin-top: 30px;">FindAba City OS • Logistics Synchronized</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: "Industrial Appointment Confirmed",
    html,
    name: "FindAba Scheduling"
  });
};

/**
 * Sends new order notification to merchant.
 */
export const sendMerchantNewOrderEmail = async (merchantEmail: string, orderId: string, amount: number, customerName: string) => {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #d4af37; border-radius: 10px; background: #0f172a; color: #f8fafc;">
      <h1 style="color: #d4af37; border-bottom: 2px solid #334155; padding-bottom: 10px;">New Incoming Order</h1>
      <p>Attention Merchant,</p>
      <p>You have a new order from a customer: <strong>${customerName}</strong>.</p>
      <div style="background: #1e293b; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Order ID:</strong> #${orderId}</p>
        <p style="margin: 5px 0;"><strong>Customer:</strong> ${customerName}</p>
        <p style="margin: 5px 0;"><strong>Payout Value:</strong> ₦${amount.toLocaleString()}</p>
      </div>
      <p>Please log in to your Merchant Dashboard to fulfill this request immediately.</p>
      <p style="font-size: 12px; color: #94a3b8; margin-top: 30px;">FindAba City OS • Merchant Network Hub</p>
    </div>
  `;

  return sendEmail({
    to: merchantEmail,
    subject: "Action Required: New Industrial Order Received",
    html,
    name: "FindAba Merchant Portal"
  });
};

/**
 * Sends order status update to customer.
 */
export const sendOrderStatusUpdateEmail = async (email: string, status: string, amount: number, trackingId: string) => {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #d4af37; border-radius: 10px; background: #0f172a; color: #f8fafc;">
      <h1 style="color: #d4af37; border-bottom: 2px solid #334155; padding-bottom: 10px;">Order Status Update</h1>
      <p>Greetings artisan,</p>
      <p>The signal for your order has been updated to: <strong style="color: #22c55e;">${status.toUpperCase()}</strong></p>
      
      <div style="background: #1e293b; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Tracking Signal:</strong> ${trackingId}</p>
        <p style="margin: 5px 0;"><strong>Value:</strong> ₦${amount.toLocaleString()}</p>
      </div>

      <p>Your industrial cargo is moving through the network. Check your dashboard for real-time GIS tracking.</p>
      <p style="font-size: 12px; color: #94a3b8; margin-top: 30px;">FindAba City OS • Logistics & Cargo Management</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `Order Update: ${status.toUpperCase()}`,
    html,
    name: "FindAba Signals"
  });
};

/**
 * Sends a notification when a profile is updated.
 */
export const sendProfileUpdateNotification = async (email: string, name: string) => {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h1 style="color: #004d2c;">Profile Updated, ${name}!</h1>
      <p>This is a security notification to inform you that your FindAba City OS profile has been recently updated.</p>
      
      <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p>Your preferences (language and notification settings) or primary details were modified.</p>
        <p>If you did not authorize this change, please reset your industrial key immediately in your security settings.</p>
      </div>
      
      <p>Safety is our core protocol in the digital registry.</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="font-size: 12px; color: #888;">FindAba City OS • Security Mesh • Aba, Nigeria</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: "Security Alert: FindAba Profile Updated",
    html,
    name: "FindAba Security"
  });
};

/**
 * Sends a notification when a business/hub is registered.
 */
export const sendBusinessRegistrationEmail = async (email: string, businessName: string, tier: string) => {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #d4af37; border-radius: 10px; background: #0f172a; color: #f8fafc;">
      <h1 style="color: #d4af37; border-bottom: 2px solid #334155; padding-bottom: 10px;">Hub Enrollment Successful</h1>
      <p>Greetings Artisan,</p>
      <p>Congratulations! Your workshop <strong>${businessName}</strong> has been successfully enrolled in the FindAba Registry.</p>
      
      <div style="background: #1e293b; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Workshop Name:</strong> ${businessName}</p>
        <p style="margin: 5px 0;"><strong>Subscription Tier:</strong> ${tier}</p>
        <p style="margin: 5px 0;"><strong>Hub Status:</strong> Pending Verification (Active on Registry)</p>
      </div>
      
      <p>You can now manage your catalog, respond to buyer signals, and view your trade analytics in the Merchant Portal.</p>
      <p>Our verification team may contact you for physical site audit to upgrade your trust level to physically verified.</p>
      
      <p style="font-size: 12px; color: #94a3b8; margin-top: 30px;">FindAba City OS • Industrial Hub Network</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: "Hub Enrollment Initialized - FindAba City OS",
    html,
    name: "FindAba Merchant Onboarding"
  });
};
