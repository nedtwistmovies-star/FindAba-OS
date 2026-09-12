import type { VercelRequest, VercelResponse } from '@vercel/node';
import diagnosticHandler from './diagnostic';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return diagnosticHandler(req, res);
}
