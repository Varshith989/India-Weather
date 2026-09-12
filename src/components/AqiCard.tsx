import React from "react";
import type { AirQualityResponse } from "../types/weather";
import { calculateNAQI } from "../utils/aqiUtils";
import { Wind, ShieldAlert, Activity } from "lucide-react";

interface AqiCardProps {
  aqiData: AirQualityResponse | null;
}

export const AqiCard: React.FC<AqiCardProps> = ({ aqiData }) => {
  if (!aqiData || !aqiData.current) {
    return (
      <div className="rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 p-4 sm:p-6 flex flex-col items-center justify-center text-center shadow-md dark:shadow-xl w-full">
        <Wind className="w-7 h-7 text-slate-400 mb-2" />
        <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400">
          Air Quality Stations Offline for this Coordinate
        </p>
      </div>
    );
  }

  const { pm10, pm2_5, nitrogen_dioxide, ozone } = aqiData.current;
  const naqi = calculateNAQI(pm2_5, pm10);

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200/90 dark:border-slate-800/80 p-4 sm:p-6 backdrop-blur-xl flex flex-col justify-between shadow-md dark:shadow-xl transition-colors w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-sky-500 dark:text-sky-400" />
          <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
            Air Quality (NAQI)
          </h3>
        </div>
        <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
          CPCB Standard
        </span>
      </div>

      {/* Meter & Score */}
      <div className="my-3.5 sm:my-5 flex items-baseline gap-3 sm:gap-4">
        <span className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
          {naqi.score}
        </span>
        <div className="flex flex-col gap-1">
          <span
            className={`inline-block px-2.5 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-extrabold uppercase border ${naqi.badgeClass}`}
          >
            {naqi.category}
          </span>
          <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">
            Pollutant: <strong className="text-slate-800 dark:text-slate-200">{naqi.prominentPollutant}</strong>
          </span>
        </div>
      </div>

      {/* Visual AQI Progress Bar */}
      <div className="w-full bg-slate-200 dark:bg-slate-800/80 h-2 rounded-full overflow-hidden mb-3 sm:mb-4">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${Math.min(100, Math.max(10, (naqi.score / 450) * 100))}%`,
            backgroundColor: naqi.color,
          }}
        />
      </div>

      {/* 4 Pollutant Sub-metrics */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mb-3 sm:mb-4">
        <div className="p-1.5 sm:p-2 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/60 rounded-xl text-center shadow-xs">
          <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 block font-medium">PM2.5</span>
          <strong className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">{Math.round(pm2_5)}</strong>
          <span className="text-[8px] sm:text-[9px] text-slate-400 dark:text-slate-500 block">µg/m³</span>
        </div>
        <div className="p-1.5 sm:p-2 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/60 rounded-xl text-center shadow-xs">
          <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 block font-medium">PM10</span>
          <strong className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">{Math.round(pm10)}</strong>
          <span className="text-[8px] sm:text-[9px] text-slate-400 dark:text-slate-500 block">µg/m³</span>
        </div>
        <div className="p-1.5 sm:p-2 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/60 rounded-xl text-center shadow-xs">
          <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Ozone</span>
          <strong className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">{Math.round(ozone)}</strong>
          <span className="text-[8px] sm:text-[9px] text-slate-400 dark:text-slate-500 block">µg/m³</span>
        </div>
        <div className="p-1.5 sm:p-2 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/60 rounded-xl text-center shadow-xs">
          <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 block font-medium">NO₂</span>
          <strong className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">{Math.round(nitrogen_dioxide)}</strong>
          <span className="text-[8px] sm:text-[9px] text-slate-400 dark:text-slate-500 block">µg/m³</span>
        </div>
      </div>

      {/* Advisory Pill */}
      <div className="flex items-start gap-2 p-2.5 sm:p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/70 shadow-xs">
        <ShieldAlert className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-500 dark:text-sky-400 shrink-0 mt-0.5" />
        <p className="text-[11px] sm:text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          {naqi.healthAdvisory}
        </p>
      </div>
    </div>
  );
};
