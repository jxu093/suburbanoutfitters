import type { WeatherCondition } from '../constants';

// OpenWeatherMap API configuration
const API_BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

// API key should be set in environment variables
// For Expo, use EXPO_PUBLIC_ prefix for client-side access
const getApiKey = () => process.env.EXPO_PUBLIC_WEATHER_API_KEY;

export type WeatherData = {
  condition: WeatherCondition;
  temperature: number; // Celsius
  description: string;
  city: string;
};

/**
 * Maps temperature in Celsius to a WeatherCondition
 */
export function mapTempToCondition(tempC: number): WeatherCondition {
  if (tempC >= 30) return 'hot';
  if (tempC >= 24) return 'warm';
  if (tempC >= 18) return 'mild';
  if (tempC >= 10) return 'cool';
  if (tempC >= 0) return 'cold';
  return 'freezing';
}

/**
 * Fetches current weather for given coordinates using OpenWeatherMap API
 */
export async function getCurrentWeather(lat: number, lon: number): Promise<WeatherData> {
  const apiKey = getApiKey();

  if (!apiKey) {
    throw new Error('Weather API key not configured. Set EXPO_PUBLIC_WEATHER_API_KEY environment variable.');
  }

  const url = `${API_BASE_URL}?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

  const response = await fetch(url);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Weather API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  const temperature = data.main?.temp ?? 20; // Default to mild if missing
  const description = data.weather?.[0]?.description ?? 'Unknown';
  const city = data.name ?? 'Unknown location';

  return {
    condition: mapTempToCondition(temperature),
    temperature: Math.round(temperature),
    description,
    city,
  };
}

/**
 * Fetches weather by city name
 */
export async function getWeatherByCity(cityName: string): Promise<WeatherData> {
  const apiKey = getApiKey();

  if (!apiKey) {
    throw new Error('Weather API key not configured. Set EXPO_PUBLIC_WEATHER_API_KEY environment variable.');
  }

  const url = `${API_BASE_URL}?q=${encodeURIComponent(cityName)}&appid=${apiKey}&units=metric`;

  const response = await fetch(url);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`City not found: ${cityName}`);
    }
    const errorText = await response.text();
    throw new Error(`Weather API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  const temperature = data.main?.temp ?? 20;
  const description = data.weather?.[0]?.description ?? 'Unknown';
  const city = data.name ?? cityName;

  return {
    condition: mapTempToCondition(temperature),
    temperature: Math.round(temperature),
    description,
    city,
  };
}

/**
 * Check if weather API is configured
 */
export function isWeatherApiConfigured(): boolean {
  return !!getApiKey();
}
