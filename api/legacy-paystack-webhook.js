# Move the previously added JS file to legacy folder (optional fallback)
# NOTE: This file is not deployed because .vercelignore excludes it.
export default async function handler(req, res) {
  // Legacy JS handler left intentionally for reference. This file is ignored by Vercel deployment.
  res.status(410).json({ error: 'Legacy handler disabled. Use the TypeScript serverless handler.' });
}
