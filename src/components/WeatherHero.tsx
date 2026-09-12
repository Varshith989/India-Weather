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
} from "lucide-react";

interface WeatherHeroProps {
  location: GeoLocation;
  weather: WeatherApiResponse;
  isFahrenheit: boolean;
}

const iconMap: Record<string, React.ReactNode> = {
  Sun: <Sun className="w-12 h-12 sm:w-16 sm:h-16 text-amber-500 dark:text-amber-400 animate-pulse-subtle" />,
  SunMedium: <SunMedium className="w-12 h-12 sm:w-16 sm:h-16 text-amber-500 dark:text-amber-400" />,
  CloudSun: <CloudSun className="w-12 h-12 sm:w-16 sm:h-16 text-sky-500 dark:text-sky-400" />,
  Cloud: <Cloud className="w-12 h-12 sm:w-16 sm:h-16 text-slate-500 dark:text-slate-300" />,
  CloudFog: <CloudFog className="w-12 h-12 sm:w-16 sm:h-16 text-slate-400" />,
  CloudDrizzle: <CloudDrizzle className="w-12 h-12 sm:w-16 sm:h-16 text-sky-400 dark:text-sky-300" />,
  CloudRain: <CloudRain className="w-12 h-12 sm:w-16 sm:h-16 text-blue-500 dark:text-blue-400" />,
  CloudRainWind: <CloudRainWind className="w-12 h-12 sm:w-16 sm:h-16 text-indigo-500 dark:text-indigo-400" />,
  Snowflake: <Snowflake className="w-12 h-12 sm:w-16 sm:h-16 text-cyan-400 dark:text-cyan-200" />,
  CloudLightning: <CloudLightning className="w-12 h-12 sm:w-16 sm:h-16 text-amber-500 dark:text-amber-300 animate-bounce" />,
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
  const unit = isFahrenheit ? "°F" : "°C";

  const conditionInfo = getWeatherConditionInfo(cur.weather_code);
  const conditionIcon = iconMap[conditionInfo.icon] || <CloudSun className="w-12 h-12 sm:w-16 sm:h-16 text-sky-500 dark:text-sky-400" />;

  const wetBulb = calculateWetBulb(cur.temperature_2m, cur.relative_humidity_2m);
  const wetBulbVal = Math.round(isFahrenheit ? (wetBulb.temp * 9) / 5 + 32 : wetBulb.temp);

  const formattedDate = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gradient-to-br dark:from-slate-900/90 dark:via-slate-900/60 dark:to-slate-800/40 border border-slate-200/90 dark:border-slate-800/80 p-4 sm:p-6 md:p-8 backdrop-blur-xl shadow-md dark:shadow-2xl flex flex-col justify-between transition-colors w-full">
      {/* Glow highlight */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Details */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] sm:text-xs font-semibold mb-2 sm:mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping" />
            LIVE OBSERVATION
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {location.name}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium mt-0.5">
            {location.state ? `${location.state}, ` : ""}India
          </p>
          <p className="text-slate-400 dark:text-slate-500 text-[11px] sm:text-xs mt-1">{formattedDate}</p>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/60 rounded-xl p-2.5 sm:p-3.5 self-start shadow-xs">
          <div className="shrink-0">{conditionIcon}</div>
          <div>
            <span className="text-sm sm:text-base md:text-lg font-bold text-slate-800 dark:text-slate-100 block">
              {conditionInfo.label}
            </span>
            <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
              Clouds & Precipitation Model
            </span>
          </div>
        </div>
      </div>

      {/* Temperature & Heat Metrics */}
      <div className="mt-5 sm:mt-8 flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6">
        <div className="flex items-baseline gap-1">
          <span className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tighter text-slate-900 dark:text-white">
            {temp}
          </span>
          <span className="text-2xl sm:text-3xl md:text-4xl font-light text-sky-600 dark:text-sky-400">
            {unit}
          </span>
        </div>

        {/* Bento Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full md:w-auto">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/60 shadow-xs">
            <Thermometer className="w-4 h-4 text-sky-500 dark:text-sky-400 shrink-0" />
            <div>
              <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Feels like</span>
              <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                {feelsLike}{unit}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/60 shadow-xs">
            <div className="w-4 h-4 rounded-full border-2 border-slate-400 flex items-center justify-center text-[9px] font-bold text-slate-500 dark:text-slate-300">
              ↕
            </div>
            <div>
              <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Min / Max</span>
              <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                {minTemp}° / {maxTemp}°
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/60 shadow-xs">
            <Flame className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
            <div>
              <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Wet Bulb Index</span>
              <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                {wetBulbVal}{unit}{" "}
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-normal">
                  ({wetBulb.status})
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
