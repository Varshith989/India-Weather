export interface GeoLocation {
  name: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
}

export interface CurrentWeatherData {
  time: string;
  temperature_2m: number;
  relative_humidity_2m: number;
  apparent_temperature: number;
  precipitation: number;
  weather_code: number;
  wind_speed_10m: number;
  wind_direction_10m: number;
  surface_pressure: number;
  visibility: number;
  dew_point_2m: number;
}

export interface HourlyForecastData {
  time: string[];
  temperature_2m: number[];
  precipitation_probability: number[];
  weather_code: number[];
  relative_humidity_2m?: number[];
  wind_speed_10m?: number[];
}

export interface DailyForecastData {
  time: string[];
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  sunrise: string[];
  sunset: string[];
  uv_index_max: number[];
  precipitation_probability_max: number[];
  precipitation_sum: number[];
}

export interface WeatherApiResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  current: CurrentWeatherData;
  hourly: HourlyForecastData;
  daily: DailyForecastData;
}

export interface AirQualityCurrent {
  time: string;
  pm10: number;
  pm2_5: number;
  nitrogen_dioxide: number;
  ozone: number;
  european_aqi: number;
  us_aqi: number;
}

export interface AirQualityResponse {
  current: AirQualityCurrent;
}

export interface IndianNAQI {
  score: number;
  category: "Good" | "Satisfactory" | "Moderate" | "Poor" | "Very Poor" | "Severe";
  color: string;
  badgeClass: string;
  healthAdvisory: string;
  prominentPollutant: string;
}

export interface WeatherAlert {
  level: "green" | "yellow" | "orange" | "red";
  title: string;
  description: string;
}
