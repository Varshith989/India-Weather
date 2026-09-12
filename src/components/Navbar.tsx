import React, { useState, useEffect, useRef } from "react";
import { Search, MapPin, Sun, Moon, X, Loader2 } from "lucide-react";
import type { GeoLocation } from "../types/weather";
import { searchIndianLocations } from "../services/geoApi";

interface NavbarProps {
  onSelectLocation: (loc: GeoLocation) => void;
  onUseCurrentLocation: () => void;
  isFahrenheit: boolean;
  onToggleUnit: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onSelectLocation,
  onUseCurrentLocation,
  isFahrenheit,
  onToggleUnit,
  isDark,
  onToggleTheme,
}) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<GeoLocation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const trimmed = query.trim();
      if (trimmed.length < 2) {
        setSuggestions([]);
        setShowDropdown(false);
        return;
      }
      setIsSearching(true);
      const results = await searchIndianLocations(trimmed);
      setSuggestions(results);
      setShowDropdown(results.length > 0);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsSearching(true);
    const results = await searchIndianLocations(query);
    if (results.length > 0) {
      onSelectLocation(results[0]);
      setShowDropdown(false);
    }
    setIsSearching(false);
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/90 dark:bg-slate-950/85 border-b border-slate-200 dark:border-slate-800/80 px-3 sm:px-6 py-2.5 sm:py-3.5 transition-colors shadow-xs w-full max-w-full">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2.5 md:gap-4 w-full">
        {/* Top Row on Mobile: Brand on Left, Actions on Right */}
        <div className="flex items-center justify-between w-full md:w-auto shrink-0">
          {/* Brand */}
          <div className="flex items-center gap-2 cursor-pointer">
            <span className="text-xl sm:text-2xl select-none">🇮🇳</span>
            <div className="flex items-center gap-1">
              <span className="font-bold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">
                India<span className="text-sky-500 dark:text-sky-400">Weather</span>
              </span>
              <span className="text-[9px] sm:text-[10px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-gradient-to-r from-sky-500 to-indigo-500 text-white">
                PRO
              </span>
            </div>
          </div>

          {/* Mobile Action Buttons (Compact right aligned) */}
          <div className="flex md:hidden items-center gap-1.5">
            {/* GPS Location */}
            <button
              onClick={onUseCurrentLocation}
              title="Use current GPS location"
              className="p-2 bg-slate-100 active:bg-slate-200 dark:bg-slate-900 dark:active:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-sky-500 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs transition-colors"
            >
              <MapPin className="w-4 h-4" />
            </button>

            {/* Unit Toggle */}
            <button
              onClick={onToggleUnit}
              title="Toggle Unit"
              className="px-2.5 py-1.5 bg-slate-100 active:bg-slate-200 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-xs transition-colors"
            >
              <span className={!isFahrenheit ? "text-sky-600 dark:text-sky-400 font-bold" : "text-slate-400"}>°C</span>
              <span className="text-slate-400 dark:text-slate-600 mx-1">|</span>
              <span className={isFahrenheit ? "text-sky-600 dark:text-sky-400 font-bold" : "text-slate-400"}>°F</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={onToggleTheme}
              title="Toggle Theme"
              className="p-2 bg-slate-100 active:bg-slate-200 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs transition-colors"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          </div>
        </div>

        {/* Full-width Search Bar (Row 2 on mobile, Center on desktop) */}
        <div className="relative w-full md:flex-1 md:max-w-lg" ref={dropdownRef}>
          <form onSubmit={handleSubmit} className="relative flex items-center w-full">
            <Search className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Indian city or 6-digit PIN..."
              className="w-full pl-9 pr-14 py-2 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all shadow-inner"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setSuggestions([]);
                }}
                className="absolute right-9 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            {isSearching && (
              <Loader2 className="absolute right-3 w-4 h-4 text-sky-500 dark:text-sky-400 animate-spin" />
            )}
          </form>

          {/* Autocomplete Dropdown */}
          {showDropdown && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden z-50 divide-y divide-slate-100 dark:divide-slate-800/60 max-h-64 overflow-y-auto">
              {suggestions.map((loc, i) => (
                <button
                  key={`${loc.name}-${i}`}
                  onClick={() => {
                    onSelectLocation(loc);
                    setShowDropdown(false);
                    setQuery("");
                  }}
                  className="w-full px-3.5 py-2.5 text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors text-xs sm:text-sm"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400 shrink-0" />
                    <span className="font-medium text-slate-800 dark:text-slate-200">{loc.name}</span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">{loc.state}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Desktop Action Buttons */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <button
            onClick={onUseCurrentLocation}
            title="Use current GPS location"
            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 border border-slate-200 dark:border-slate-800 rounded-xl transition-all shadow-xs"
          >
            <MapPin className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleUnit}
            title="Toggle Temperature Unit"
            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all shadow-xs"
          >
            <span className={!isFahrenheit ? "text-sky-600 dark:text-sky-400 font-bold" : "text-slate-400"}>°C</span>
            <span className="text-slate-400 dark:text-slate-600 mx-1">|</span>
            <span className={isFahrenheit ? "text-sky-600 dark:text-sky-400 font-bold" : "text-slate-400"}>°F</span>
          </button>

          <button
            onClick={onToggleTheme}
            title="Toggle Theme"
            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-amber-500 dark:hover:text-amber-400 border border-slate-200 dark:border-slate-800 rounded-xl transition-all shadow-xs"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
