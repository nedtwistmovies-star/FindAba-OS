import { sendEmail } from "./resend";

export async function sendPaymentSuccessEmail(
  email: string,
 reference: string,
  amount: number
) {
  return sendEmail({
    to: email,
    subject: "Payment Confirmed - FindAba City OS",
    name: "FindAba Finance",
    html: `
      ...
    `
  });
}
