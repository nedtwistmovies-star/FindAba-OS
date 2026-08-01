export default async function handler(req: any, res: any) {
  // Deprecated catch-all index endpoint — replaced by targeted serverless functions.
  // Returning 404 to avoid importing server.ts in the Lambda environment.
  res.status(404).json({ error: 'Deprecated endpoint. Use specific /api/* serverless functions.' });
}
