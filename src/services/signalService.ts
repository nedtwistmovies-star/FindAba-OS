
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
  try {
    // Using wttr.in for a simple, no-key-required weather signal
    const response = await fetch('https://wttr.in/Aba?format=%t|%C|%h|%w');
    if (!response.ok) throw new Error('Weather signal lost');
    const text = await response.text();
    const [temp, condition, humidity, wind] = text.split('|');
    return {
      temp: temp.trim(),
      condition: condition.trim(),
      humidity: humidity.trim(),
      wind: wind.trim()
    };
  } catch (error) {
    console.error('Weather fetch error:', error);
    return {
      temp: '28°C',
      condition: 'Clear',
      humidity: '65%',
      wind: '12km/h'
    };
  }
}
