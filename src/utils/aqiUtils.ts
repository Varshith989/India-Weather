import type { IndianNAQI, WeatherAlert, CurrentWeatherData, DailyForecastData } from "../types/weather";

/**
 * Calculates Indian National Air Quality Index (NAQI) based on CPCB standards.
 * Breakpoints for PM2.5 (dominant urban pollutant in India):
 * Good: 0-30 -> NAQI 0-50
 * Satisfactory: 31-60 -> NAQI 51-100
 * Moderate: 61-90 -> NAQI 101-200
 * Poor: 91-120 -> NAQI 201-300
 * Very Poor: 121-250 -> NAQI 301-400
 * Severe: 250+ -> NAQI 401-500
 */
export function calculateNAQI(pm25: number, pm10: number): IndianNAQI {
  let score = 0;
  let category: IndianNAQI["category"] = "Good";
  let color = "#10b981";
  let badgeClass = "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
  let healthAdvisory = "Air quality is considered satisfactory, and air pollution poses little or no risk.";

  if (pm25 <= 30) {
    score = Math.round((pm25 / 30) * 50);
    category = "Good";
    color = "#10b981";
    badgeClass = "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    healthAdvisory = "Minimal impact. Safe for outdoor activities and exercise.";
  } else if (pm25 <= 60) {
    score = 50 + Math.round(((pm25 - 30) / 30) * 50);
    category = "Satisfactory";
    color = "#84cc16";
    badgeClass = "bg-lime-500/20 text-lime-400 border-lime-500/30";
    healthAdvisory = "Minor breathing discomfort to sensitive people.";
  } else if (pm25 <= 90) {
    score = 100 + Math.round(((pm25 - 60) / 30) * 100);
    category = "Moderate";
    color = "#f59e0b";
    badgeClass = "bg-amber-500/20 text-amber-400 border-amber-500/30";
    healthAdvisory = "May cause breathing discomfort to children, elderly, and people with lung/heart disease.";
  } else if (pm25 <= 120) {
    score = 200 + Math.round(((pm25 - 90) / 30) * 100);
    category = "Poor";
    color = "#f97316";
    badgeClass = "bg-orange-500/20 text-orange-400 border-orange-500/30";
    healthAdvisory = "Breathing discomfort on prolonged exposure. Wear N95 mask outdoors.";
  } else if (pm25 <= 250) {
    score = 300 + Math.round(((pm25 - 120) / 130) * 100);
    category = "Very Poor";
    color = "#ef4444";
    badgeClass = "bg-red-500/20 text-red-400 border-red-500/30";
    healthAdvisory = "Respiratory illness on prolonged exposure. Avoid strenuous outdoor activities.";
  } else {
    score = 400 + Math.min(100, Math.round(((pm25 - 250) / 150) * 100));
    category = "Severe";
    color = "#991b1b";
    badgeClass = "bg-rose-900/40 text-rose-300 border-rose-700/50";
    healthAdvisory = "Emergency health warning. Serious impact even on healthy people. Keep windows closed.";
  }

  return {
    score: Math.min(500, score),
    category,
    color,
    badgeClass,
    healthAdvisory,
    prominentPollutant: pm25 >= pm10 / 2 ? "PM2.5" : "PM10",
  };
}

/**
 * Stull's formula for calculating Wet-Bulb temperature in Celsius
 */
export function calculateWetBulb(tempC: number, rh: number): { temp: number; status: string } {
  const tw =
    tempC * Math.atan(0.151977 * Math.pow(rh + 8.313659, 0.5)) +
    Math.atan(tempC + rh) -
    Math.atan(rh - 1.676331) +
    0.00391838 * Math.pow(rh, 1.5) * Math.atan(0.023101 * rh) -
    4.686035;

  let status = "Comfortable";
  if (tw >= 31) status = "Life Threatening";
  else if (tw >= 29) status = "Extreme Heat Stress";
  else if (tw >= 27) status = "High Caution";
  else if (tw >= 24) status = "Moderate";

  return { temp: Math.round(tw * 10) / 10, status };
}

export function evaluateWeatherAlert(cur: CurrentWeatherData, daily: DailyForecastData): WeatherAlert | null {
  if (cur.temperature_2m >= 42) {
    return {
      level: "red",
      title: "IMD Red Alert: Severe Heatwave",
      description: `Extreme daytime temperature of ${Math.round(cur.temperature_2m)}°C recorded. High risk of heat stroke. Stay indoors between 11:30 AM and 4 PM.`,
    };
  }
  if (cur.temperature_2m >= 39) {
    return {
      level: "orange",
      title: "IMD Orange Alert: Heatwave Advisory",
      description: "Severe heat condition. Drink ample water, carry umbrellas or head coverings.",
    };
  }
  if (daily.precipitation_probability_max[0] >= 75 && daily.precipitation_sum[0] >= 40) {
    return {
      level: "orange",
      title: "IMD Orange Alert: Heavy Monsoon Downpour",
      description: `Significant rainfall (${daily.precipitation_sum[0].toFixed(0)}mm) predicted. Localized waterlogging possible on main urban roads.`,
    };
  }
  if (cur.wind_speed_10m >= 45) {
    return {
      level: "yellow",
      title: "Squall & High Gust Warning",
      description: `Wind gusts exceeding ${Math.round(cur.wind_speed_10m)} km/h. Secure loose objects and stay clear of old trees/hoardings.`,
    };
  }
  if (cur.temperature_2m <= 5) {
    return {
      level: "yellow",
      title: "IMD Cold Wave Advisory",
      description: "Severe cold wave conditions during morning and night hours. Wear adequate winter clothing.",
    };
  }
  return null;
}

export function getWeatherConditionInfo(code: number): { label: string; icon: string } {
  switch (code) {
    case 0:
      return { label: "Clear Sky", icon: "Sun" };
    case 1:
      return { label: "Mainly Clear", icon: "SunMedium" };
    case 2:
      return { label: "Partly Cloudy", icon: "CloudSun" };
    case 3:
      return { label: "Overcast", icon: "Cloud" };
    case 45:
    case 48:
      return { label: "Fog & Haze", icon: "CloudFog" };
    case 51:
    case 53:
    case 55:
      return { label: "Light Drizzle", icon: "CloudDrizzle" };
    case 61:
    case 63:
      return { label: "Rain Showers", icon: "CloudRain" };
    case 65:
      return { label: "Heavy Rainfall", icon: "CloudRainWind" };
    case 71:
    case 73:
    case 75:
      return { label: "Snowfall", icon: "Snowflake" };
    case 80:
    case 81:
    case 82:
      return { label: "Torrential Showers", icon: "CloudRainWind" };
    case 95:
    case 96:
    case 99:
      return { label: "Severe Thunderstorm", icon: "CloudLightning" };
    default:
      return { label: "Passing Clouds", icon: "Cloud" };
  }
}
