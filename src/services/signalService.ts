
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
    condition: 'Harmattan / Clear',
    humidity: '65%',
    wind: '12km/h'
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    // Call server proxy to completely prevent client-side CORS failures
    const response = await fetch('/api/weather', {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    }).catch(() => null);
    
    clearTimeout(timeoutId);

    if (response && response.ok) {
      const data = await response.json().catch(() => null);
      if (data && data.temp) {
        return {
          temp: String(data.temp).trim().slice(0, 10),
          condition: String(data.condition || 'Partly Cloudy').trim().slice(0, 30),
          humidity: String(data.humidity || '65%').trim().slice(0, 10),
          wind: String(data.wind || '12km/h').trim().slice(0, 20)
        };
      }
    }

    return defaultWeather;
  } catch (error: any) {
    return defaultWeather;
  }
}
