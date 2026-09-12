import React from "react";
import type { DailyForecastData } from "../types/weather";
import { getWeatherConditionInfo } from "../utils/aqiUtils";
import { Calendar, Droplets } from "lucide-react";

interface ForecastGridProps {
  daily: DailyForecastData;
  isFahrenheit: boolean;
}

export const ForecastGrid: React.FC<ForecastGridProps> = ({
  daily,
  isFahrenheit,
}) => {
  const toDisplay = (c: number) => {
    return Math.round(isFahrenheit ? (c * 9) / 5 + 32 : c);
  };

  const days = [];
  for (let i = 0; i < Math.min(7, daily.time.length); i++) {
    const dateObj = new Date(daily.time[i]);
    const dayLabel =
      i === 0
        ? "Today"
        : dateObj.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" });
    const maxT = toDisplay(daily.temperature_2m_max[i]);
    const minT = toDisplay(daily.temperature_2m_min[i]);
    const condition = getWeatherConditionInfo(daily.weather_code[i]);
    const rainProb = daily.precipitation_probability_max[i];

    days.push({
      dayLabel,
      conditionLabel: condition.label,
      maxT,
      minT,
      rainProb,
    });
  }

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200/90 dark:border-slate-800/80 p-5 backdrop-blur-xl shadow-md dark:shadow-xl flex flex-col justify-between transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-sky-500 dark:text-sky-400" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
            7-Day Extended Outlook
          </h3>
        </div>
        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
          Open-Meteo High Res
        </span>
      </div>

      <div className="space-y-2.5">
        {days.map((d, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-colors text-xs shadow-xs"
          >
            <span className="w-20 font-semibold text-slate-800 dark:text-slate-200">
              {d.dayLabel}
            </span>

            <div className="flex items-center gap-1 w-14 text-sky-600 dark:text-sky-400 font-medium">
              <Droplets className="w-3 h-3 text-sky-500 dark:text-sky-400" />
              <span>{d.rainProb}%</span>
            </div>

            <span className="flex-1 text-slate-500 dark:text-slate-400 truncate mx-2">
              {d.conditionLabel}
            </span>

            <div className="flex items-center gap-2 font-bold shrink-0">
              <span className="text-slate-900 dark:text-slate-100">{d.maxT}°</span>
              <span className="text-slate-400 dark:text-slate-500 font-medium">{d.minT}°</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
