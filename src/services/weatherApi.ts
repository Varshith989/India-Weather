import type { WeatherApiResponse, AirQualityResponse } from "../types/weather";

export async function fetchFullWeatherData(
  lat: number,
  lon: number
): Promise<{ weather: WeatherApiResponse; aqi: AirQualityResponse | null }> {
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure,visibility,dew_point_2m&hourly=temperature_2m,precipitation_probability,weather_code,relative_humidity_2m,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max,precipitation_sum&timezone=auto`;
  const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm10,pm2_5,nitrogen_dioxide,ozone,european_aqi,us_aqi`;

  const [weatherRes, aqiRes] = await Promise.all([
    fetch(weatherUrl),
    fetch(aqiUrl).catch(() => null),
  ]);

  if (!weatherRes.ok) {
    throw new Error("Failed to load meteorological data from Open-Meteo.");
  }

  const weather = await weatherRes.json();
  const aqi = aqiRes && aqiRes.ok ? await aqiRes.json() : null;

  return { weather, aqi };
}
