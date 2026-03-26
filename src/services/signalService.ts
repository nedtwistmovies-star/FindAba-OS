/**
 * Igbo Market + Weather Intelligence Service (v2 - Stable)
 */

export const IGBO_MARKET_DAYS = ['Eke', 'Orie', 'Afor', 'Nkwo'] as const;

export type IgboMarketDay = typeof IGBO_MARKET_DAYS[number];

/**
 * Get Igbo Market Day using a fixed real-world anchor
 * Anchor: March 23, 2026 = Afor (index 2)
 */
export function getIgboMarketDay(date: Date = new Date()): IgboMarketDay {
  const msInDay = 24 * 60 * 60 * 1000;

  const anchorDate = new Date('2026-03-23T00:00:00Z'); // Afor
  const anchorIndex = 2; // Afor

  const diffDays = Math.floor((date.getTime() - anchorDate.getTime()) / msInDay);

  const index = (anchorIndex + diffDays % 4 + 4) % 4;

  return IGBO_MARKET_DAYS[index];
}

/**
 * Weather Data Interface
 */
export interface WeatherData {
  temp: string;
  condition: string;
  humidity: string;
  wind: string;
}

/**
 * Fetch Aba Weather (resilient version)
 */
export async function getAbaWeather(): Promise<WeatherData> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(
      'https://wttr.in/Aba?format=%t|%C|%h|%w',
      { signal: controller.signal }
    );

    clearTimeout(timeout);

    if (!response.ok) throw new Error('Weather signal lost');

    const text = await response.text();
    const parts = text.split('|');

    if (parts.length < 4) throw new Error('Invalid weather format');

    const [temp, condition, humidity, wind] = parts;

    return {
      temp: temp.trim(),
      condition: condition.trim(),
      humidity: humidity.trim(),
      wind: wind.trim()
    };

  } catch (error) {
    console.warn('[Weather] Using fallback data:', error);

    return {
      temp: '28°C',
      condition: 'Partly Cloudy',
      humidity: '65%',
      wind: '10–15 km/h'
    };
  }
}