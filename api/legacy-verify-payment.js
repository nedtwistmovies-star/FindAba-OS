// Legacy placeholder for verify-payment JS handler
// This file is kept only for reference and uses a different filename to avoid route conflicts.
export default async function handler(req, res) {
  res.status(410).json({ error: 'Legacy handler disabled. Use the TypeScript serverless handler.' });
}
