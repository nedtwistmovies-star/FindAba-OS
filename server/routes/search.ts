import { Router } from 'express';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';

export const searchRouter = Router();

const TELEMETRY_FILE = path.join(process.cwd(), 'search_demand.json');

const telemetrySchema = z.object({
  query: z.string(),
  resultsCount: z.number(),
  timestamp: z.string().optional(),
  location: z.object({
    lat: z.number().optional(),
    lng: z.number().optional()
  }).optional()
});

searchRouter.post('/telemetry', (req, res) => {
  try {
    const data = telemetrySchema.parse(req.body);
    const entry = {
      ...data,
      timestamp: data.timestamp || new Date().toISOString()
    };

    let history: any[] = [];
    if (fs.existsSync(TELEMETRY_FILE)) {
      try {
        history = JSON.parse(fs.readFileSync(TELEMETRY_FILE, 'utf8'));
      } catch (e) {
        history = [];
      }
    }

    history.push(entry);
    
    // Keep only last 1000 entries
    if (history.length > 1000) {
      history = history.slice(-1000);
    }

    fs.writeFileSync(TELEMETRY_FILE, JSON.stringify(history, null, 2));
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: 'Invalid telemetry data' });
  }
});

searchRouter.get('/demand', (req, res) => {
  if (!fs.existsSync(TELEMETRY_FILE)) {
    return res.json([]);
  }
  const history = JSON.parse(fs.readFileSync(TELEMETRY_FILE, 'utf8'));
  res.json(history);
});
