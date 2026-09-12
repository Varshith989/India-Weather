import React, { useState } from "react";
import type { WeatherApiResponse, AirQualityResponse } from "../types/weather";
import {
  Sparkles,
  Umbrella,
  HeartPulse,
  Shirt,
  Volume2,
  VolumeX,
  Share2,
} from "lucide-react";
import type { SpeechLanguage } from "../services/speechService";
import { speakWeatherBriefing, stopSpeaking } from "../services/speechService";

interface SmartAdvisoryProps {
  weather: WeatherApiResponse;
  aqi: AirQualityResponse | null;
  cityName: string;
  isSpeaking?: boolean;
  onToggleVoice?: () => void;
  speechLang?: SpeechLanguage;
  onSelectSpeechLang?: (lang: SpeechLanguage) => void;
}

export const SmartAdvisory: React.FC<SmartAdvisoryProps> = ({
  weather,
  aqi,
  cityName,
  isSpeaking: externalSpeaking,
  onToggleVoice: externalToggleVoice,
  speechLang = "en",
  onSelectSpeechLang,
}) => {
  const [internalSpeaking, setInternalSpeaking] = useState(false);
  const isSpeaking = externalSpeaking !== undefined ? externalSpeaking : internalSpeaking;

  const cur = weather.current;
  const daily = weather.daily;
  const rainProb = daily.precipitation_probability_max[0];
  const pm25 = aqi?.current?.pm2_5 || 0;

  // Advisory logic
  const rainAdvice =
    rainProb >= 60
      ? "Frequent showers likely. Keep an umbrella and expect minor urban traffic delays."
      : rainProb >= 25
      ? "Passing scattered drizzles possible. Light jacket or compact umbrella advised."
      : "Dry conditions. No rain interference for daily commute or travel.";

  const healthAdvice =
    pm25 > 120
      ? "Very poor air quality. Wear an N95 mask outside; run indoor air purifiers."
      : pm25 > 60
      ? "Moderate air pollution. Sensitive individuals should reduce intense outdoor workouts."
      : "Clean air. Great window for outdoor morning runs and yoga.";

  const dryingAdvice =
    cur.relative_humidity_2m < 55 && cur.temperature_2m > 28
      ? "Excellent sunshine & low humidity. Outdoor laundry will dry in under 2 hours."
      : cur.relative_humidity_2m > 80
      ? "Heavy air moisture. Outdoor drying will take extended time; use indoor racks."
      : "Standard drying conditions. 3 to 4 hours required for laundry.";

  // Audio briefing via SpeechSynthesis
  const handleToggleVoice = () => {
    if (externalToggleVoice) {
      externalToggleVoice();
      return;
    }

    if (isSpeaking) {
      stopSpeaking();
      setInternalSpeaking(false);
      return;
    }

    speakWeatherBriefing({
      cityName,
      temperature: cur.temperature_2m,
      feelsLike: cur.apparent_temperature,
      weatherCode: cur.weather_code,
      humidity: cur.relative_humidity_2m,
      rainProbability: rainProb,
      pm25,
      speechLang,
      onStart: () => setInternalSpeaking(true),
      onEnd: () => setInternalSpeaking(false),
    });
  };

  // WhatsApp share
  const handleShareWhatsApp = () => {
    const text = `🇮🇳 *IndiaWeather Update for ${cityName}*\n🌡️ Temp: ${Math.round(
      cur.temperature_2m
    )}°C (Feels like ${Math.round(cur.apparent_temperature)}°C)\n💧 Humidity: ${
      cur.relative_humidity_2m
    }%\n🌧️ Rain Chance: ${rainProb}%\n🍃 PM2.5: ${Math.round(
      pm25
    )} µg/m³\n\nChecked on IndiaWeather Pro!`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-gradient-to-br dark:from-slate-900/80 dark:via-slate-900/60 dark:to-indigo-950/30 border border-slate-200/90 dark:border-slate-800/80 p-5 backdrop-blur-xl shadow-md dark:shadow-xl flex flex-col justify-between transition-colors">
      {/* Header with Voice and Language controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
            Smart Weather Copilot • Daily Living Advisory
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {/* Language selector for speech */}
          {onSelectSpeechLang && (
            <div className="flex items-center rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700 text-xs font-semibold">
              <button
                onClick={() => onSelectSpeechLang("en")}
                className={`px-2 py-0.5 rounded-md transition-all ${
                  speechLang === "en"
                    ? "bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-xs font-bold"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
                }`}
                title="Indian Natural English Speech"
              >
                EN
              </button>
              <button
                onClick={() => onSelectSpeechLang("hi")}
                className={`px-2 py-0.5 rounded-md transition-all ${
                  speechLang === "hi"
                    ? "bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-xs font-bold"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
                }`}
                title="भारतीय प्राकृतिक हिंदी आवाज़"
              >
                हिन्दी
              </button>
            </div>
          )}

          <button
            onClick={externalToggleVoice || handleToggleVoice}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all shadow-xs ${
              isSpeaking
                ? "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30 animate-pulse"
                : "bg-sky-50 text-sky-700 hover:bg-sky-100 border-sky-300 dark:bg-sky-500/20 dark:text-sky-400 dark:border-sky-500/30 dark:hover:bg-sky-500/30"
            }`}
            title={`Listen to Natural ${speechLang === "hi" ? "Hindi" : "Indian English"} Weather Briefing`}
          >
            {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span>{isSpeaking ? "Stop Voice" : speechLang === "hi" ? "🎙️ आवाज़ ब्रीफिंग" : "🎙️ Voice Briefing"}</span>
          </button>

          <button
            onClick={handleShareWhatsApp}
            title="Share snapshot to WhatsApp"
            className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 dark:bg-emerald-600/20 dark:text-emerald-400 dark:hover:bg-emerald-600/30 dark:border-emerald-500/30 rounded-lg transition-colors shadow-xs"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3 Lifestyle Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/50 shadow-xs">
          <Umbrella className="w-4 h-4 text-sky-500 dark:text-sky-400 shrink-0 mt-0.5" />
          <div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-0.5">
              Commute & Rain
            </span>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              {rainAdvice}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/50 shadow-xs">
          <HeartPulse className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
          <div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-0.5">
              Health & Workout
            </span>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              {healthAdvice}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/50 shadow-xs">
          <Shirt className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-0.5">
              Laundry & Drying
            </span>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              {dryingAdvice}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
