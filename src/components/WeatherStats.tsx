import React from "react";
import type { CurrentWeatherData, DailyForecastData } from "../types/weather";
import {
  Droplets,
  Wind,
  Sun,
  Eye,
  Compass,
  Sunrise,
  Sunset,
} from "lucide-react";

interface WeatherStatsProps {
  current: CurrentWeatherData;
  daily: DailyForecastData;
  isFahrenheit: boolean;
}

export const WeatherStats: React.FC<WeatherStatsProps> = ({
  current,
  daily,
  isFahrenheit,
}) => {
  const toDisplay = (c: number) => {
    return Math.round(isFahrenheit ? (c * 9) / 5 + 32 : c);
  };

  const visKm = (current.visibility / 1000).toFixed(1);
  const uv = daily.uv_index_max[0];
  const sunriseStr = new Date(daily.sunrise[0]).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  const sunsetStr = new Date(daily.sunset[0]).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* Humidity */}
      <div className="rounded-xl bg-white dark:bg-slate-900/70 border border-slate-200/90 dark:border-slate-800/80 p-3.5 flex flex-col justify-between shadow-xs transition-colors">
        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-medium">
          <Droplets className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
          <span>Humidity</span>
        </div>
        <strong className="text-xl font-bold text-slate-900 dark:text-slate-100 my-1">
          {current.relative_humidity_2m}%
        </strong>
        <span className="text-[10px] text-slate-400 dark:text-slate-500">
          Dew pt: {toDisplay(current.dew_point_2m)}°
        </span>
      </div>

      {/* Wind */}
      <div className="rounded-xl bg-white dark:bg-slate-900/70 border border-slate-200/90 dark:border-slate-800/80 p-3.5 flex flex-col justify-between shadow-xs transition-colors">
        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-medium">
          <Wind className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
          <span>Wind</span>
        </div>
        <strong className="text-xl font-bold text-slate-900 dark:text-slate-100 my-1">
          {Math.round(current.wind_speed_10m)} <span className="text-xs font-normal">km/h</span>
        </strong>
        <span className="text-[10px] text-slate-400 dark:text-slate-500">
          Dir: {current.wind_direction_10m}°
        </span>
      </div>

      {/* UV Index */}
      <div className="rounded-xl bg-white dark:bg-slate-900/70 border border-slate-200/90 dark:border-slate-800/80 p-3.5 flex flex-col justify-between shadow-xs transition-colors">
        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-medium">
          <Sun className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
          <span>UV Index</span>
        </div>
        <strong className="text-xl font-bold text-slate-900 dark:text-slate-100 my-1">
          {uv.toFixed(1)}
        </strong>
        <span className="text-[10px] text-slate-400 dark:text-slate-500">
          {uv > 7 ? "Very High" : uv > 5 ? "Moderate" : "Low"}
        </span>
      </div>

      {/* Visibility */}
      <div className="rounded-xl bg-white dark:bg-slate-900/70 border border-slate-200/90 dark:border-slate-800/80 p-3.5 flex flex-col justify-between shadow-xs transition-colors">
        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-medium">
          <Eye className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
          <span>Visibility</span>
        </div>
        <strong className="text-xl font-bold text-slate-900 dark:text-slate-100 my-1">
          {visKm} <span className="text-xs font-normal">km</span>
        </strong>
        <span className="text-[10px] text-slate-400 dark:text-slate-500">
          {Number(visKm) < 2 ? "Fog Risk" : "Clear Air"}
        </span>
      </div>

      {/* Pressure */}
      <div className="rounded-xl bg-white dark:bg-slate-900/70 border border-slate-200/90 dark:border-slate-800/80 p-3.5 flex flex-col justify-between shadow-xs transition-colors">
        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-medium">
          <Compass className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
          <span>Pressure</span>
        </div>
        <strong className="text-xl font-bold text-slate-900 dark:text-slate-100 my-1">
          {Math.round(current.surface_pressure)} <span className="text-xs font-normal">hPa</span>
        </strong>
        <span className="text-[10px] text-slate-400 dark:text-slate-500">
          Barometric
        </span>
      </div>

      {/* Sun Cycle */}
      <div className="rounded-xl bg-white dark:bg-slate-900/70 border border-slate-200/90 dark:border-slate-800/80 p-3.5 flex flex-col justify-between shadow-xs transition-colors">
        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-medium">
          <Sunrise className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
          <span>Sun Cycle</span>
        </div>
        <div className="my-1 flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
          <span>{sunriseStr}</span>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <span>{sunsetStr}</span>
        </div>
        <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
          <Sunset className="w-3 h-3 text-orange-500 dark:text-orange-400" /> Sunset at {sunsetStr}
        </span>
      </div>
    </div>
  );
};
