import { Business } from '../types';
import { triggerWebhook, WebhookEvent } from './webhookService';

export const setOpenRouterKey = (_key: string) => {
  // Deprecated: API keys are managed exclusively on the server side.
  console.log("[Oracle] Note: OpenRouter API keys are managed securely on the server.");
};

export const getOpenRouterStream = async (
  prompt: string,
  history: any[],
  catalog: Business[],
  model: string = "meta-llama/llama-3.3-70b-instruct"
) => {
  const { getSupabase } = await import('./supabaseService');
  const sb = getSupabase();
  let session = null;
  if (sb) {
    try {
      const sessionResult = await sb.auth.getSession();
      session = sessionResult?.data?.session || null;
    } catch (e) {
      // Guest mode
    }
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };

  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }

  const response = await fetch("/api/oracle", {
    method: "POST",
    headers,
    body: JSON.stringify({
      prompt,
      history,
      catalog,
      type: 'search',
      provider: 'openrouter'
    }),
  });

  const text = await response.text();
  let result: any = {};
  try { result = text && text.trim() ? JSON.parse(text) : {}; } catch {}

  if (!response.ok) {
    throw new Error(result.error || "Oracle Signal Sync Fault");
  }

  triggerWebhook(WebhookEvent.SEARCH_QUERY, { 
    query: typeof prompt === 'string' ? prompt : 'flyer', 
    engine: 'openrouter', 
    model: model,
    wisdom: (result.text || result.wisdom || '').substring(0, 100) 
  }, { silent: true });

  return {
    text: result.text || result.wisdom || "Signal lost. Re-establishing...",
    thoughtProcess: result.thoughtProcess || result.thought_process,
    dataPoints: result.dataPoints || result.data_points || { verified_facts: [], locations: [] },
    suggestions: result.suggestions || result.trade_signals || [],
    grounding: result.grounding
  };
};
