
import OpenAI from "openai";

export const getOracleStreamOpenAI = async (
  prompt: string, 
  history: any[], 
  sys: string
) => {
  try {
    const response = await fetch('/api/oracle/openai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, history, sys })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'OpenAI Backend Fault');
    }

    return await response.json();
  } catch (e: any) {
    console.error("[Oracle] OpenAI Proxy Fault:", e);
    return null;
  }
};
