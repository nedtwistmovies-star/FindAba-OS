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
