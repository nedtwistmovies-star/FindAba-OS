
export const IGBO_MARKET_DAYS = ['Eke', 'Orie', 'Afor', 'Nkwo'];

/**
 * Calculates the current Igbo market day.
 * Reference: January 1, 1970 (Unix Epoch) was an Orie day.
 * Cycle: Eke (0), Orie (1), Afor (2), Nkwo (3)
 */
export function getIgboMarketDay(date: Date = new Date()): string {
  const msInDay = 24 * 60 * 60 * 1000;
  // Use UTC to avoid timezone shifts affecting the day count
  const daysSinceEpoch = Math.floor(date.getTime() / msInDay);
  // Correction: Today (March 23, 2026) is Afor. 
  // Based on the cycle Eke(0), Orie(1), Afor(2), Nkwo(3), 
  // we adjust the offset to align with the local calendar.
  const index = (daysSinceEpoch + 3) % 4;
  return IGBO_MARKET_DAYS[index];
}

export interface WeatherData {
  temp: string;
  condition: string;
  humidity: string;
  wind: string;
}

export async function getAbaWeather(): Promise<WeatherData> {
  const defaultWeather: WeatherData = {
    temp: '28°C',
    condition: 'Clear',
    humidity: '65%',
    wind: '12km/h'
  };

  try {
    // Using wttr.in for a simple, no-key-required weather signal
    // Added a timeout to prevent long-hanging fetches
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch('https://wttr.in/Aba?format=%t|%C|%h|%w', {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) throw new Error('Weather signal lost');
    
    const text = (await response.text()).slice(0, 500);
    if (!text || !text.includes('|') || text.includes('<!DOCTYPE') || text.includes('<html')) {
      throw new Error('Invalid weather signal received');
    }
    
    const parts = text.split('|');
    if (parts.length < 2) throw new Error('Incomplete weather signal');
    
    const [temp, condition, humidity, wind] = parts;
    return {
      temp: (temp || '28°C').trim().slice(0, 10),
      condition: (condition || 'Clear').trim().slice(0, 30),
      humidity: (humidity || '65%').trim().slice(0, 10),
      wind: (wind || '12km/h').trim().slice(0, 20)
    };
  } catch (error: any) {
    // Only log actual errors, not aborts or common network failures in dev
    if (error.name !== 'AbortError') {
      console.debug('Weather sync bypassed, using local atmospheric fallback.');
    }
    return defaultWeather;
  }
}
