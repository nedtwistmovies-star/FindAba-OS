import { Resend } from "resend";
import { env } from "./env";

/** Default client constructed lazily or if RESEND_API_KEY is available. */
const defaultClient = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

interface SendEmailArgs {
  to: string;
  subject: string;
  html: string;
  from?: string;
  name?: string;
  apiKeyOverride?: string;
}

export async function sendEmail({
  to,
  subject,
  html,
  from = "onboarding@findaba.com.ng",
  name,
  apiKeyOverride,
}: SendEmailArgs) {
  const client = apiKeyOverride ? new Resend(apiKeyOverride) : defaultClient;

  if (!client) {
    throw new Error("Email service not configured — set RESEND_API_KEY or provide an apiKey override.");
  }

  const { data, error } = await client.emails.send({
    from: name ? `${name} <${from}>` : from,
    to: [to],
    subject,
    html,
  });

  if (error) throw new Error(error.message);
  return data;
}
