import { useState, useEffect } from "react";
import type { GeoLocation, WeatherApiResponse, AirQualityResponse } from "./types/weather";
import type { Language } from "./utils/i18n";
import { translations } from "./utils/i18n";
import { fetchFullWeatherData } from "./services/weatherApi";
import { reverseGeocodeCoords } from "./services/geoApi";
import { evaluateWeatherAlert } from "./utils/aqiUtils";

import { Navbar } from "./components/Navbar";
import { WeatherHero } from "./components/WeatherHero";
import { AqiCard } from "./components/AqiCard";
import { RadarMap } from "./components/RadarMap";
import { HourlyTimeline } from "./components/HourlyTimeline";
import { ForecastGrid } from "./components/ForecastGrid";
import { WeatherStats } from "./components/WeatherStats";
import { SmartAdvisory } from "./components/SmartAdvisory";
import { speakWeatherBriefing, stopSpeaking, subscribeSpeakingState } from "./services/speechService";

import { AlertTriangle, X, Loader2, Heart, Plus, PhoneCall, Sprout, Volume2, VolumeX } from "lucide-react";

export function App() {
  const [location, setLocation] = useState<GeoLocation>({
    name: "Hyderabad",
    state: "Telangana",
    country: "India",
    latitude: 17.385,
    longitude: 78.4867,
  });

  const [weather, setWeather] = useState<WeatherApiResponse | null>(null);
  const [aqi, setAqi] = useState<AirQualityResponse | null>(null);
  const [isFahrenheit, setIsFahrenheit] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [currentLang] = useState<Language>("en");
  const [showEmergency, setShowEmergency] = useState(false);
  const [isAgroMode, setIsAgroMode] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const t = translations[currentLang];

  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem("fav_cities");
    return saved ? JSON.parse(saved) : ["Hyderabad", "Mumbai", "New Delhi", "Bengaluru", "Kolkata"];
  });

  // Sync dark class on document.documentElement (html tag)
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  // Load weather whenever location coordinates change
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      setError(null);
      setAlertDismissed(false);

      try {
        const { weather: wData, aqi: aqiData } = await fetchFullWeatherData(
          location.latitude,
          location.longitude
        );

        if (isMounted) {
          setWeather(wData);
          setAqi(aqiData);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "Could not fetch meteorological observations.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [location.latitude, location.longitude]);

  // Handle Current Location Geolocation
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const rev = await reverseGeocodeCoords(pos.coords.latitude, pos.coords.longitude);
        setLocation(rev);
      },
      () => {
        setIsLoading(false);
        setError("Location permission denied. Please allow location access or search manually.");
      },
      { timeout: 10000 }
    );
  };

  const handleToggleFavorite = () => {
    if (!favorites.includes(location.name)) {
      const next = [...favorites, location.name];
      setFavorites(next);
      localStorage.setItem("fav_cities", JSON.stringify(next));
    }
  };

  const handleSelectFavorite = async (cityName: string) => {
    try {
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json&countryCode=IN`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const loc = data.results[0];
        setLocation({
          name: loc.name,
          state: loc.admin1 || "India",
          country: "India",
          latitude: loc.latitude,
          longitude: loc.longitude,
        });
      }
    } catch {
      setError(`Could not locate ${cityName}`);
    }
  };

  // Synchronize speaking state with speech audio engine
  useEffect(() => {
    return subscribeSpeakingState(setIsSpeaking);
  }, []);

  // Cancel speech whenever location changes
  useEffect(() => {
    stopSpeaking();
  }, [location.latitude, location.longitude]);

  // Audio briefing via SpeechSynthesis
  const handleToggleVoice = () => {
    if (isSpeaking) {
      stopSpeaking();
      return;
    }

    if (!weather) return;

    speakWeatherBriefing({
      cityName: location.name,
      temperature: weather.current.temperature_2m,
      feelsLike: weather.current.apparent_temperature,
      weatherCode: weather.current.weather_code,
      humidity: weather.current.relative_humidity_2m,
      rainProbability: weather.daily.precipitation_probability_max[0] || 0,
      pm25: aqi?.current?.pm2_5,
      isAgroMode,
    });
  };

  // Weather Alert detection
  const alert = weather ? evaluateWeatherAlert(weather.current, weather.daily) : null;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200 w-full max-w-full overflow-x-hidden">
      {/* Navbar */}
      <Navbar
        onSelectLocation={(loc) => setLocation(loc)}
        onUseCurrentLocation={handleUseCurrentLocation}
        isFahrenheit={isFahrenheit}
        onToggleUnit={() => setIsFahrenheit(!isFahrenheit)}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-4 lg:px-8 py-3.5 sm:py-6 space-y-3.5 sm:space-y-6 overflow-x-hidden">
        {/* Error Alert */}
        {error && (
          <div className="p-3.5 sm:p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 dark:text-rose-400 text-xs sm:text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-400 p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Dynamic Weather Alert Banner */}
        {alert && !alertDismissed && (
          <div
            className={`p-3.5 sm:p-4 rounded-2xl border flex items-center justify-between gap-3 shadow-md transition-all ${
              alert.level === "red"
                ? "bg-rose-50 border-rose-300 text-rose-900 dark:bg-rose-950/40 dark:border-rose-600/50 dark:text-rose-200"
                : alert.level === "orange"
                ? "bg-orange-50 border-orange-300 text-orange-900 dark:bg-orange-950/40 dark:border-orange-600/50 dark:text-orange-200"
                : "bg-amber-50 border-amber-300 text-amber-900 dark:bg-amber-950/40 dark:border-amber-600/50 dark:text-amber-200"
            }`}
          >
            <div className="flex items-center gap-2.5 sm:gap-3">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-amber-500" />
              <div>
                <strong className="text-xs sm:text-sm font-bold block">{alert.title}</strong>
                <p className="text-[11px] sm:text-xs opacity-90">{alert.description}</p>
              </div>
            </div>
            <button
              onClick={() => setAlertDismissed(true)}
              className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Unified Elevated Modes & Quick Cities Command Strip */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 w-full bg-white/80 dark:bg-slate-900/70 p-2.5 sm:p-3 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 backdrop-blur-xl shadow-xs transition-colors">
          {/* Quick Cities Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none w-full md:w-auto">
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider shrink-0 pr-1">
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span>Favorites:</span>
            </div>
            {favorites.map((fav) => {
              const isActive = location.name.toLowerCase().includes(fav.toLowerCase());
              return (
                <button
                  key={fav}
                  onClick={() => handleSelectFavorite(fav)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                    isActive
                      ? "bg-sky-500 text-white shadow-xs shadow-sky-500/30"
                      : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/90 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/60"
                  }`}
                >
                  {fav}
                </button>
              );
            })}
            <button
              onClick={handleToggleFavorite}
              title="Save current location to quick favorites"
              className="px-2.5 py-1 rounded-xl border border-dashed border-slate-300 hover:border-sky-400 dark:border-slate-700 dark:hover:border-sky-500 text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400 text-xs font-medium flex items-center gap-1 shrink-0 transition-colors"
            >
              <Plus className="w-3 h-3" /> Save
            </button>
          </div>

          {/* Top-Notch Mode Switches */}
          <div className="flex items-center gap-2 shrink-0 self-start md:self-auto overflow-x-auto w-full md:w-auto pt-1 md:pt-0">
            {/* Agro / Kisan Mode */}
            <button
              onClick={() => setIsAgroMode(!isAgroMode)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs shrink-0 ${
                isAgroMode
                  ? "bg-emerald-600 text-white shadow-emerald-600/20 ring-2 ring-emerald-500/30"
                  : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/90 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/60"
              }`}
              title="Toggle Kisan Agro-Meteorology Advisory Mode"
            >
              <Sprout className="w-3.5 h-3.5" />
              <span>{isAgroMode ? "🌾 Agro Mode Active" : "🌾 Kisan Mode"}</span>
            </button>

            {/* Voice Copilot */}
            <button
              onClick={handleToggleVoice}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs shrink-0 ${
                isSpeaking
                  ? "bg-sky-500 text-white animate-pulse"
                  : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/90 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/60"
              }`}
              title="Listen to Speech Synthesis Weather Briefing"
            >
              {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span>{isSpeaking ? "Stop Voice" : "🎙️ Voice Briefing"}</span>
            </button>

            {/* Emergency SOS Drawer Toggle */}
            <button
              onClick={() => setShowEmergency(!showEmergency)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs shrink-0 ${
                showEmergency
                  ? "bg-rose-600 text-white shadow-rose-600/20"
                  : "bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30"
              }`}
              title="Indian Disaster Management Helplines"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>🚨 SOS Helplines</span>
            </button>
          </div>
        </div>

        {/* Disaster Helpline Drawer with Direct 1-Tap Dial */}
        {showEmergency && (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-rose-300 dark:border-rose-500/40 shadow-lg grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-xs w-full animate-fadeIn">
            <a
              href="tel:1078"
              className="p-3 bg-rose-50/70 hover:bg-rose-100/90 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 rounded-xl border border-rose-200 dark:border-rose-800/50 flex flex-col justify-between gap-1 transition-all group shadow-xs"
            >
              <span className="text-slate-500 dark:text-slate-400 text-[10px] font-semibold">NDRF Disaster Response</span>
              <div className="flex items-center justify-between">
                <strong className="text-rose-600 dark:text-rose-400 text-base font-black">1078</strong>
                <span className="text-[10px] text-rose-500 font-bold group-hover:underline">Call 📞</span>
              </div>
            </a>

            <a
              href="tel:112"
              className="p-3 bg-rose-50/70 hover:bg-rose-100/90 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 rounded-xl border border-rose-200 dark:border-rose-800/50 flex flex-col justify-between gap-1 transition-all group shadow-xs"
            >
              <span className="text-slate-500 dark:text-slate-400 text-[10px] font-semibold">National Emergency</span>
              <div className="flex items-center justify-between">
                <strong className="text-rose-600 dark:text-rose-400 text-base font-black">112</strong>
                <span className="text-[10px] text-rose-500 font-bold group-hover:underline">Call 📞</span>
              </div>
            </a>

            <a
              href="tel:108"
              className="p-3 bg-rose-50/70 hover:bg-rose-100/90 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 rounded-xl border border-rose-200 dark:border-rose-800/50 flex flex-col justify-between gap-1 transition-all group shadow-xs"
            >
              <span className="text-slate-500 dark:text-slate-400 text-[10px] font-semibold">Emergency Ambulance</span>
              <div className="flex items-center justify-between">
                <strong className="text-rose-600 dark:text-rose-400 text-base font-black">108</strong>
                <span className="text-[10px] text-rose-500 font-bold group-hover:underline">Call 📞</span>
              </div>
            </a>

            <a
              href="tel:18001801717"
              className="p-3 bg-rose-50/70 hover:bg-rose-100/90 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 rounded-xl border border-rose-200 dark:border-rose-800/50 flex flex-col justify-between gap-1 transition-all group shadow-xs"
            >
              <span className="text-slate-500 dark:text-slate-400 text-[10px] font-semibold">IMD Weather Toll-Free</span>
              <div className="flex items-center justify-between">
                <strong className="text-rose-600 dark:text-rose-400 text-xs sm:text-sm font-black">1800-180-1717</strong>
                <span className="text-[10px] text-rose-500 font-bold group-hover:underline">Call 📞</span>
              </div>
            </a>
          </div>
        )}

        {/* Loading Spinner */}
        {isLoading ? (
          <div className="py-20 sm:py-24 flex flex-col items-center justify-center text-center gap-3 w-full">
            <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 text-sky-500 animate-spin" />
            <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
              Fetching live telemetry for {location.name}...
            </p>
          </div>
        ) : weather ? (
          <div className="space-y-3.5 sm:space-y-6 w-full">
            {/* Top Grid: Hero Weather Card + Air Quality Card */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-6 w-full">
              <div className="lg:col-span-7 w-full">
                <WeatherHero
                  location={location}
                  weather={weather}
                  isFahrenheit={isFahrenheit}
                  isAgroMode={isAgroMode}
                />
              </div>
              <div className="lg:col-span-5 w-full">
                <AqiCard aqiData={aqi} />
              </div>
            </div>

            {/* Key Meteorological Parameters */}
            <WeatherStats
              current={weather.current}
              daily={weather.daily}
              isFahrenheit={isFahrenheit}
            />

            {/* 24-Hour Timeline */}
            <HourlyTimeline
              hourly={weather.hourly}
              isFahrenheit={isFahrenheit}
            />

            {/* Middle Grid: Live Doppler Radar + 7-Day Extended Outlook */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-6 w-full">
              <div className="lg:col-span-7 w-full">
                <RadarMap
                  latitude={location.latitude}
                  longitude={location.longitude}
                  cityName={location.name}
                />
              </div>
              <div className="lg:col-span-5 w-full">
                <ForecastGrid
                  daily={weather.daily}
                  isFahrenheit={isFahrenheit}
                />
              </div>
            </div>

            {/* Smart Advisory Copilot */}
            <SmartAdvisory
              weather={weather}
              aqi={aqi}
              cityName={location.name}
              isAgroMode={isAgroMode}
              onToggleAgro={() => setIsAgroMode(!isAgroMode)}
              isSpeaking={isSpeaking}
              onToggleVoice={handleToggleVoice}
            />
          </div>
        ) : null}
      </main>

      {/* Footer */}
      <footer className="mt-8 sm:mt-12 border-t border-slate-200 dark:border-slate-800/80 bg-white/70 dark:bg-slate-950/60 py-4 sm:py-6 px-4 text-center text-[11px] sm:text-xs text-slate-500 w-full">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3">
          <p>
            🇮🇳 <strong>{t.appName} PRO</strong> • Built with Open-Meteo High Resolution Model, CPCB NAQI Standards, & RainViewer Radar.
          </p>
          <p>
            Supports all 28 States & 8 Union Territories + 6-digit Postal PIN Codes.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
