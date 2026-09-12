import React from "react";
import type { HourlyForecastData } from "../types/weather";
import { getWeatherConditionInfo } from "../utils/aqiUtils";
import { Clock, Droplets, TrendingUp } from "lucide-react";

interface HourlyTimelineProps {
  hourly: HourlyForecastData;
  isFahrenheit: boolean;
}

export const HourlyTimeline: React.FC<HourlyTimelineProps> = ({
  hourly,
  isFahrenheit,
}) => {
  const currentHour = new Date().getHours();
  let startIdx = 0;

  for (let i = 0; i < hourly.time.length; i++) {
    if (new Date(hourly.time[i]).getHours() >= currentHour) {
      startIdx = i;
      break;
    }
  }

  const hoursToDisplay = [];
  const temps: number[] = [];

  for (let i = startIdx; i < startIdx + 24 && i < hourly.time.length; i++) {
    const rawTemp = hourly.temperature_2m[i];
    const displayTemp = Math.round(isFahrenheit ? (rawTemp * 9) / 5 + 32 : rawTemp);
    temps.push(displayTemp);

    const dateObj = new Date(hourly.time[i]);
    const timeStr = dateObj.toLocaleTimeString("en-IN", {
      hour: "numeric",
      hour12: true,
    });
    const condition = getWeatherConditionInfo(hourly.weather_code[i]);
    const rainProb = hourly.precipitation_probability[i];

    hoursToDisplay.push({
      time: i === startIdx ? "Now" : timeStr,
      temp: displayTemp,
      conditionLabel: condition.label,
      rainProb,
    });
  }

  // Generate SVG path for 24-hour temperature trend
  const minTemp = Math.min(...temps);
  const maxTemp = Math.max(...temps);
  const tempRange = maxTemp === minTemp ? 1 : maxTemp - minTemp;
  const svgWidth = 800;
  const svgHeight = 50;

  const points = temps.map((t, idx) => {
    const x = (idx / (temps.length - 1)) * svgWidth;
    const y = svgHeight - 8 - ((t - minTemp) / tempRange) * (svgHeight - 16);
    return { x, y };
  });

  const pathD = points.reduce((acc, p, idx) => {
    return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, "");

  const fillD = `${pathD} L ${svgWidth} ${svgHeight} L 0 ${svgHeight} Z`;

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200/90 dark:border-slate-800/80 p-5 backdrop-blur-xl shadow-md dark:shadow-xl flex flex-col justify-between transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-sky-500 dark:text-sky-400" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
            24-Hour Micro-Forecast
          </h3>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-sky-600 dark:text-sky-400 font-medium">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>
            Temp Trend: {minTemp}° - {maxTemp}°
          </span>
        </div>
      </div>

      {/* SVG Temperature Curve */}
      <div className="w-full h-12 my-2 overflow-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full preserve-3d"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <path d={fillD} fill="url(#tempGradient)" />
          <path
            d={pathD}
            fill="none"
            stroke="#0284c7"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Hourly Card Scroller */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
        {hoursToDisplay.map((item, idx) => (
          <div
            key={idx}
            className={`shrink-0 flex flex-col items-center justify-between p-3 rounded-xl border transition-all ${
              idx === 0
                ? "bg-sky-50 border-sky-300 text-sky-900 dark:bg-sky-500/10 dark:border-sky-500/30 dark:text-white"
                : "bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800/60 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs"
            }`}
            style={{ width: "86px", minHeight: "105px" }}
          >
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {item.time}
            </span>

            <span className="text-lg font-bold my-0.5">
              {item.temp}°
            </span>

            <div className="flex items-center gap-1 text-[10px] text-sky-600 dark:text-sky-400 font-semibold">
              <Droplets className="w-3 h-3 text-sky-500 dark:text-sky-400" />
              <span>{item.rainProb}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
