import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async ({ to, subject, html, from, name }) => {
  try {
    const { data, error } = await resend.emails.send({
      from: `${name || 'FindAba'} <${from || 'onboarding@findaba.com.ng'}>`,
      to,
      subject,
      html,
    });
    if (error) return { success: false, error: error.message };
    return { success: true, id: data.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const sendPaymentSuccessEmail = async (email, reference, amount) => {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #d4af37; border-radius: 10px; background: #0f172a; color: #f8fafc;">
      <h1 style="color: #22c55e; border-bottom: 2px solid #334155; padding-bottom: 10px;">Payment Successful</h1>
      <p>Excellent news!</p>
      <p>Payment successful. Your order is confirmed.</p>
      <div style="background: #1e293b; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Transaction Ref:</strong> ${reference}</p>
        <p style="margin: 5px 0;"><strong>Amount Paid:</strong> ₦${amount.toLocaleString()}</p>
      </div>
      <p>Your items are now being prepared for delivery.</p>
      <p style="font-size: 12px; color: #94a3b8; margin-top: 30px;">FindAba • Payment Complete</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: "Payment Confirmed - FindAba City OS",
    html,
    name: "FindAba Finance"
  });
};
