import React from "react";
import type { GeoLocation, WeatherApiResponse } from "../types/weather";
import { calculateWetBulb, getWeatherConditionInfo } from "../utils/aqiUtils";
import {
  Sun,
  SunMedium,
  CloudSun,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudRainWind,
  Snowflake,
  CloudLightning,
  Flame,
  Thermometer,
  ArrowUpDown,
  MapPin,
  Clock,
  Compass,
} from "lucide-react";

interface WeatherHeroProps {
  location: GeoLocation;
  weather: WeatherApiResponse;
  isFahrenheit: boolean;
}

const iconMap: Record<string, React.ReactNode> = {
  Sun: <Sun className="w-10 h-10 sm:w-14 sm:h-14 text-amber-500 dark:text-amber-400" />,
  SunMedium: <SunMedium className="w-10 h-10 sm:w-14 sm:h-14 text-amber-500 dark:text-amber-400" />,
  CloudSun: <CloudSun className="w-10 h-10 sm:w-14 sm:h-14 text-sky-500 dark:text-sky-400" />,
  Cloud: <Cloud className="w-10 h-10 sm:w-14 sm:h-14 text-slate-500 dark:text-slate-300" />,
  CloudFog: <CloudFog className="w-10 h-10 sm:w-14 sm:h-14 text-slate-400" />,
  CloudDrizzle: <CloudDrizzle className="w-10 h-10 sm:w-14 sm:h-14 text-sky-400 dark:text-sky-300" />,
  CloudRain: <CloudRain className="w-10 h-10 sm:w-14 sm:h-14 text-blue-500 dark:text-blue-400" />,
  CloudRainWind: <CloudRainWind className="w-10 h-10 sm:w-14 sm:h-14 text-indigo-500 dark:text-indigo-400" />,
  Snowflake: <Snowflake className="w-10 h-10 sm:w-14 sm:h-14 text-cyan-400 dark:text-cyan-200" />,
  CloudLightning: <CloudLightning className="w-10 h-10 sm:w-14 sm:h-14 text-amber-500 dark:text-amber-300" />,
};

export const WeatherHero: React.FC<WeatherHeroProps> = ({
  location,
  weather,
  isFahrenheit,
}) => {
  const cur = weather.current;
  const daily = weather.daily;

  const toDisplayTemp = (c: number) => {
    return Math.round(isFahrenheit ? (c * 9) / 5 + 32 : c);
  };

  const temp = toDisplayTemp(cur.temperature_2m);
  const feelsLike = toDisplayTemp(cur.apparent_temperature);
  const maxTemp = toDisplayTemp(daily.temperature_2m_max[0]);
  const minTemp = toDisplayTemp(daily.temperature_2m_min[0]);
  const rainProb = daily.precipitation_probability_max[0] || 0;
  const unit = isFahrenheit ? "°F" : "°C";

  const conditionInfo = getWeatherConditionInfo(cur.weather_code);
  const conditionIcon = iconMap[conditionInfo.icon] || (
    <CloudSun className="w-10 h-10 sm:w-14 sm:h-14 text-sky-500 dark:text-sky-400" />
  );

  const wetBulb = calculateWetBulb(cur.temperature_2m, cur.relative_humidity_2m);
  const wetBulbVal = Math.round(isFahrenheit ? (wetBulb.temp * 9) / 5 + 32 : wetBulb.temp);

  // Formatted date and time
  const formattedDate = new Date().toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const formattedTime = new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  // Calculate percentage for temperature range bar
  const tempRange = maxTemp - minTemp;
  const tempPercentage = tempRange > 0 ? Math.min(100, Math.max(5, ((temp - minTemp) / tempRange) * 100)) : 50;

  // Wet bulb risk badge color
  const wetBulbRiskColor =
    wetBulb.status === "Extreme Danger" || wetBulb.status === "Danger"
      ? "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20"
      : wetBulb.status === "Caution"
      ? "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20"
      : "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20";

  return (
    <div className="relative overflow-hidden rounded-3xl bg-white/95 dark:bg-gradient-to-br dark:from-slate-900/95 dark:via-slate-900/85 dark:to-slate-950/90 border border-slate-200/90 dark:border-slate-800/80 p-4 sm:p-6 lg:p-7 backdrop-blur-xl shadow-lg dark:shadow-2xl flex flex-col justify-between transition-colors w-full">
      {/* Ambient decorative glow */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-sky-500/10 dark:bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header Row: Live Radar Status + Real-time Clock */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800/60">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-emerald-600 dark:text-emerald-400">
            Live Telemetry
          </span>
          <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
          <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">
            IMD Doppler Network
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100/80 dark:bg-slate-800/60 px-2.5 py-1 rounded-full border border-slate-200/80 dark:border-slate-700/60 shadow-xs">
          <Clock className="w-3 h-3 text-sky-500 dark:text-sky-400" />
          <span>{formattedDate}, {formattedTime} IST</span>
        </div>
      </div>

      {/* Location Headline */}
      <div className="pt-3 sm:pt-4">
        <div className="flex flex-wrap items-baseline gap-2">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
            <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-sky-500 dark:text-sky-400 shrink-0" />
            <span>{location.name}</span>
          </h1>
          <span className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">
            {location.state ? `${location.state}, ` : ""}India
          </span>
          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/80 text-[10px] font-mono text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60">
            {location.latitude.toFixed(2)}°N, {location.longitude.toFixed(2)}°E
          </span>
        </div>
      </div>

      {/* Centerpiece: Temperature & Current Weather Condition */}
      <div className="my-4 sm:my-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-50/80 to-sky-50/50 dark:from-slate-950/50 dark:to-sky-950/20 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/70 shadow-xs">
        {/* Left: Huge Temp & High/Low */}
        <div>
          <div className="flex items-baseline font-black tracking-tighter text-slate-900 dark:text-white">
            <span className="text-5xl sm:text-6xl lg:text-7xl leading-none">
              {temp}
            </span>
            <span className="text-2xl sm:text-3xl font-light text-sky-600 dark:text-sky-400 ml-1">
              {unit}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300">
            <span className="text-rose-600 dark:text-rose-400 font-bold">
              H: {maxTemp}°
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-sky-600 dark:text-sky-400 font-bold">
              L: {minTemp}°
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-slate-700 dark:text-slate-300">
              Feels like <strong className="font-bold">{feelsLike}{unit}</strong>
            </span>
          </div>
        </div>

        {/* Right: Condition Icon & Badge */}
        <div className="flex items-center gap-3 sm:border-l sm:border-slate-200/80 dark:sm:border-slate-800/70 sm:pl-5">
          <div className="p-2 sm:p-3 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm shrink-0">
            {conditionIcon}
          </div>
          <div>
            <span className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 block">
              {conditionInfo.label}
            </span>
            <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 block font-medium mt-0.5">
              Wind {cur.wind_speed_10m} km/h • Humidity {cur.relative_humidity_2m}%
            </span>
          </div>
        </div>
      </div>


      {/* Bento Grid: 4 Micro Telemetry Cards (2x2 on Mobile, 4 columns on Desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {/* 1. Feels Like */}
        <div className="p-3 rounded-xl bg-slate-50/90 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/70 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Comfort
            </span>
            <Thermometer className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
          </div>
          <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
            {feelsLike}{unit}
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 truncate">
            {cur.relative_humidity_2m > 70 ? "Humid & sticky" : cur.relative_humidity_2m < 40 ? "Dry breeze" : "Pleasant comfort"}
          </span>
        </div>

        {/* 2. Daily Range */}
        <div className="p-3 rounded-xl bg-slate-50/90 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/70 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Daily Range
            </span>
            <ArrowUpDown className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
          </div>
          <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
            {minTemp}° - {maxTemp}°
          </div>
          {/* Mini Visual Gradient Bar */}
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
            <div
              className="h-full bg-gradient-to-r from-sky-400 to-amber-500 rounded-full"
              style={{ width: `${tempPercentage}%` }}
            />
          </div>
        </div>

        {/* 3. Wet Bulb Index */}
        <div className="p-3 rounded-xl bg-slate-50/90 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/70 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Wet Bulb
            </span>
            <Flame className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
          </div>
          <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
            {wetBulbVal}{unit}
          </div>
          <span className={`inline-block text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded border mt-1 w-fit ${wetBulbRiskColor}`}>
            {wetBulb.status}
          </span>
        </div>

        {/* 4. Rain & Wind */}
        <div className="p-3 rounded-xl bg-slate-50/90 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/70 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Rain Chance
            </span>
            <Compass className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
          </div>
          <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
            {rainProb}%
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 truncate">
            {rainProb > 50 ? "Showers likely" : rainProb > 20 ? "Passing drizzle" : "Dry conditions"}
          </span>
        </div>
      </div>
    </div>
  );
};
