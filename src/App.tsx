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

import { AlertTriangle, X, Loader2, Heart, Plus, PhoneCall } from "lucide-react";

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
  const [currentLang, setCurrentLang] = useState<Language>("en");
  const [showEmergency, setShowEmergency] = useState(false);

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

  // Weather Alert detection
  const alert = weather ? evaluateWeatherAlert(weather.current, weather.daily) : null;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* Navbar */}
      <Navbar
        onSelectLocation={(loc) => setLocation(loc)}
        onUseCurrentLocation={handleUseCurrentLocation}
        isFahrenheit={isFahrenheit}
        onToggleUnit={() => setIsFahrenheit(!isFahrenheit)}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        currentLang={currentLang}
        onSelectLang={(lang) => setCurrentLang(lang)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 space-y-6">
        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 dark:text-rose-400 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-400">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Dynamic Weather Alert Banner */}
        {alert && !alertDismissed && (
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between gap-3 shadow-md transition-all ${
              alert.level === "red"
                ? "bg-rose-50 border-rose-300 text-rose-900 dark:bg-rose-950/40 dark:border-rose-600/50 dark:text-rose-200"
                : alert.level === "orange"
                ? "bg-orange-50 border-orange-300 text-orange-900 dark:bg-orange-950/40 dark:border-orange-600/50 dark:text-orange-200"
                : "bg-amber-50 border-amber-300 text-amber-900 dark:bg-amber-950/40 dark:border-amber-600/50 dark:text-amber-200"
            }`}
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500" />
              <div>
                <strong className="text-sm font-bold block">{alert.title}</strong>
                <p className="text-xs opacity-90">{alert.description}</p>
              </div>
            </div>
            <button
              onClick={() => setAlertDismissed(true)}
              className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Action Top Bar: Favorite Cities & Emergency SOS toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            <span className="text-slate-500 dark:text-slate-400 font-semibold shrink-0 flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> Quick Cities:
            </span>
            {favorites.map((fav) => (
              <button
                key={fav}
                onClick={() => handleSelectFavorite(fav)}
                className={`px-3 py-1 rounded-full border shrink-0 transition-all font-medium ${
                  location.name.toLowerCase().includes(fav.toLowerCase())
                    ? "bg-sky-100 text-sky-700 border-sky-300 font-bold dark:bg-sky-500/20 dark:text-sky-400 dark:border-sky-500/40"
                    : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 dark:bg-slate-900/60 dark:border-slate-800 dark:text-slate-300 dark:hover:border-slate-700 shadow-sm"
                }`}
              >
                {fav}
              </button>
            ))}
            <button
              onClick={handleToggleFavorite}
              title="Save current location"
              className="px-2.5 py-1 rounded-full border border-dashed border-slate-300 text-slate-500 hover:text-sky-600 hover:border-sky-400 dark:border-slate-700 dark:text-slate-400 dark:hover:text-sky-400 dark:hover:border-sky-500/50 flex items-center gap-1 shrink-0 transition-colors"
            >
              <Plus className="w-3 h-3" /> Save current
            </button>
          </div>

          <button
            onClick={() => setShowEmergency(!showEmergency)}
            className="px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400 dark:hover:bg-rose-500/20 flex items-center gap-1.5 font-semibold transition-colors shadow-sm"
          >
            <PhoneCall className="w-3 h-3" />
            <span>Disaster SOS Helplines</span>
          </button>
        </div>

        {/* Disaster Helpline Drawer */}
        {showEmergency && (
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-rose-200 dark:border-rose-500/30 shadow-md grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">NDRF Helpline</span>
              <strong className="text-rose-600 dark:text-rose-400 text-sm font-bold">1078</strong>
            </div>
            <div className="p-2.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">National Emergency</span>
              <strong className="text-rose-600 dark:text-rose-400 text-sm font-bold">112</strong>
            </div>
            <div className="p-2.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Medical Ambulance</span>
              <strong className="text-rose-600 dark:text-rose-400 text-sm font-bold">108</strong>
            </div>
            <div className="p-2.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">IMD Weather Toll-Free</span>
              <strong className="text-rose-600 dark:text-rose-400 text-sm font-bold">1800-180-1717</strong>
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center text-center gap-3">
            <Loader2 className="w-10 h-10 text-sky-500 animate-spin" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Fetching live weather & air quality telemetry for {location.name}...
            </p>
          </div>
        ) : weather ? (
          <div className="space-y-6">
            {/* Top Grid: Hero Weather Card + Air Quality Card */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7">
                <WeatherHero
                  location={location}
                  weather={weather}
                  isFahrenheit={isFahrenheit}
                />
              </div>
              <div className="lg:col-span-5">
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
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7">
                <RadarMap
                  latitude={location.latitude}
                  longitude={location.longitude}
                  cityName={location.name}
                />
              </div>
              <div className="lg:col-span-5">
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
            />
          </div>
        ) : null}
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-200 dark:border-slate-800/80 bg-white/70 dark:bg-slate-950/60 py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
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
