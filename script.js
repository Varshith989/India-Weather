// ==========================================================================
// STATE MANAGEMENT & CONFIGURATION
// ==========================================================================
const AppState = {
  currentData: null,
  currentCity: "",
  isFahrenheit: false,
  activeSuggestionIndex: -1,
  abortController: null,
  geocodeAbortController: null,
};

// DOM Cache
const DOM = {
  cityInput: document.getElementById("cityInput"),
  searchForm: document.getElementById("searchForm"),
  clearInputBtn: document.getElementById("clearInputBtn"),
  locationBtn: document.getElementById("locationBtn"),
  themeBtn: document.getElementById("themeBtn"),
  unitBtn: document.getElementById("unitBtn"),
  favoriteBtn: document.getElementById("favoriteBtn"),
  suggestionsBox: document.getElementById("suggestions"),
  errorBanner: document.getElementById("error"),
  weatherSection: document.getElementById("weather"),
  
  // Weather Elements
  cityName: document.getElementById("cityName"),
  dateText: document.getElementById("dateText"),
  temperature: document.getElementById("temperature"),
  feelsLike: document.getElementById("feelsLike"),
  unit: document.getElementById("unit"),
  condition: document.getElementById("condition"),
  weatherIconContainer: document.getElementById("weatherIconContainer"),
  humidity: document.getElementById("humidity"),
  wind: document.getElementById("wind"),
  windDirection: document.getElementById("windDirection"),
  visibility: document.getElementById("visibility"),
  rain: document.getElementById("rain"),
  uv: document.getElementById("uv"),
  sunrise: document.getElementById("sunrise"),
  sunset: document.getElementById("sunset"),
  hourlyContainer: document.getElementById("hourly"),
  forecastContainer: document.getElementById("forecast"),
  favoritesContainer: document.getElementById("favorites"),
};

// ==========================================================================
// INITIALIZATION
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  renderFavorites();
  setupEventListeners();
  setupNetworkListeners();

  // Initial load
  DOM.cityInput.value = "Hyderabad";
  searchWeather("Hyderabad");
});

// ==========================================================================
// EVENT LISTENERS & KEYBOARD ACCESSIBILITY
// ==========================================================================
function setupEventListeners() {
  // Form submission
  DOM.searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    closeSuggestions();
    const query = DOM.cityInput.value.trim();
    if (query) searchWeather(query);
  });

  // Debounced input search
  let debounceTimeout = null;
  DOM.cityInput.addEventListener("input", (e) => {
    const query = e.target.value.trim();
    DOM.clearInputBtn.classList.toggle("hidden", query.length === 0);

    clearTimeout(debounceTimeout);
    AppState.activeSuggestionIndex = -1;

    if (query.length < 2) {
      closeSuggestions();
      return;
    }

    debounceTimeout = setTimeout(() => {
      fetchCitySuggestions(query);
    }, 280);
  });

  // Keyboard navigation for search suggestions (Arrow Up / Down / Enter / Esc)
  DOM.cityInput.addEventListener("keydown", (e) => {
    const items = DOM.suggestionsBox.querySelectorAll(".suggestion-item");
    if (!items.length || DOM.suggestionsBox.classList.contains("hidden")) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      AppState.activeSuggestionIndex = (AppState.activeSuggestionIndex + 1) % items.length;
      updateActiveSuggestion(items);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      AppState.activeSuggestionIndex = (AppState.activeSuggestionIndex - 1 + items.length) % items.length;
      updateActiveSuggestion(items);
    } else if (e.key === "Enter" && AppState.activeSuggestionIndex > -1) {
      e.preventDefault();
      items[AppState.activeSuggestionIndex].click();
    } else if (e.key === "Escape") {
      closeSuggestions();
    }
  });

  // Clear Input Button
  DOM.clearInputBtn.addEventListener("click", () => {
    DOM.cityInput.value = "";
    DOM.clearInputBtn.classList.add("hidden");
    closeSuggestions();
    DOM.cityInput.focus();
  });

  // Click outside suggestions dropdown to dismiss
  document.addEventListener("click", (e) => {
    if (!DOM.suggestionsBox.contains(e.target) && e.target !== DOM.cityInput) {
      closeSuggestions();
    }
  });

  // Theme Toggle
  DOM.themeBtn.addEventListener("click", toggleTheme);

  // Unit Toggle (°C / °F)
  DOM.unitBtn.addEventListener("click", () => {
    AppState.isFahrenheit = !AppState.isFahrenheit;
    DOM.unitBtn.textContent = AppState.isFahrenheit ? "°F" : "°C";

    if (AppState.currentData) {
      displayWeather(AppState.currentData.data, AppState.currentData.city);
    }
  });

  // Favorite & Location Buttons
  DOM.favoriteBtn.addEventListener("click", addFavorite);
  DOM.locationBtn.addEventListener("click", useLocation);
}

// Network connectivity watcher
function setupNetworkListeners() {
  window.addEventListener("offline", () => {
    showError("Network offline. Please check your internet connection.");
  });

  window.addEventListener("online", () => {
    clearError();
    if (AppState.currentCity) searchWeather(AppState.currentCity);
  });
}

// ==========================================================================
// CITY AUTOCOMPLETE SUGGESTIONS
// ==========================================================================
async function fetchCitySuggestions(query) {
  if (AppState.geocodeAbortController) {
    AppState.geocodeAbortController.abort();
  }
  AppState.geocodeAbortController = new AbortController();

  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json&countryCode=IN`;
    const res = await fetch(url, { signal: AppState.geocodeAbortController.signal });
    if (!res.ok) return;

    const data = await res.json();
    if (!data.results || data.results.length === 0) {
      closeSuggestions();
      return;
    }

    DOM.suggestionsBox.innerHTML = "";
    data.results.forEach((place) => {
      const item = document.createElement("div");
      item.className = "suggestion-item";
      item.setAttribute("role", "button");
      item.setAttribute("tabindex", "0");

      const stateInfo = place.admin1 ? `${place.admin1}, ` : "";
      item.innerHTML = `
        <div class="sugg-left">
          <strong>${place.name}</strong>
          <span>${stateInfo}India</span>
        </div>
        <span class="sugg-coords">${place.latitude.toFixed(2)}°, ${place.longitude.toFixed(2)}°</span>
      `;

      item.addEventListener("click", () => {
        DOM.cityInput.value = place.name;
        closeSuggestions();
        getWeather(place.latitude, place.longitude, place.name);
      });

      DOM.suggestionsBox.appendChild(item);
    });

    DOM.suggestionsBox.classList.remove("hidden");
  } catch (err) {
    if (err.name !== "AbortError") {
      closeSuggestions();
    }
  }
}

function updateActiveSuggestion(items) {
  items.forEach((item, idx) => {
    item.classList.toggle("selected", idx === AppState.activeSuggestionIndex);
    if (idx === AppState.activeSuggestionIndex) {
      item.scrollIntoView({ block: "nearest" });
    }
  });
}

function closeSuggestions() {
  DOM.suggestionsBox.innerHTML = "";
  DOM.suggestionsBox.classList.add("hidden");
  AppState.activeSuggestionIndex = -1;
}

// ==========================================================================
// WEATHER DATA RETRIEVAL (ASYNC / ABORT CONTROLLER)
// ==========================================================================
async function searchWeather(customCity = null) {
  const city = (customCity || DOM.cityInput.value).trim();
  if (!city) {
    showError("Please enter an Indian city or district.");
    return;
  }

  clearError();
  setLoadingState(true);

  try {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json&countryCode=IN`;
    const res = await fetch(geoUrl);
    const data = await res.json();

    if (!data.results || data.results.length === 0) {
      throw new Error(`Could not find "${city}" in India. Please check the spelling.`);
    }

    const loc = data.results[0];
    await getWeather(loc.latitude, loc.longitude, loc.name);
  } catch (error) {
    showError(error.message || "Failed to find location.");
  } finally {
    setLoadingState(false);
  }
}

async function getWeather(latitude, longitude, cityName) {
  clearError();

  // Abort previous in-flight weather call
  if (AppState.abortController) {
    AppState.abortController.abort();
  }
  AppState.abortController = new AbortController();

  try {
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m,visibility&hourly=temperature_2m,weather_code,precipitation_probability,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max,sunrise,sunset&timezone=auto`;

    const res = await fetch(weatherUrl, { signal: AppState.abortController.signal });
    if (!res.ok) throw new Error("Weather service is temporarily unavailable.");

    const data = await res.json();

    AppState.currentData = { data, city: cityName };
    AppState.currentCity = cityName;

    displayWeather(data, cityName);
  } catch (err) {
    if (err.name !== "AbortError") {
      showError("Could not retrieve current weather. Please retry.");
    }
  }
}

// ==========================================================================
// RENDER WEATHER UI
// ==========================================================================
function displayWeather(data, city) {
  DOM.cityName.textContent = city;
  DOM.dateText.textContent = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  const current = data.current;
  const isDay = current.is_day === 1;

  let temp = current.temperature_2m;
  let feels = current.apparent_temperature;

  if (AppState.isFahrenheit) {
    temp = celsiusToFahrenheit(temp);
    feels = celsiusToFahrenheit(feels);
  }

  DOM.temperature.textContent = Math.round(temp);
  DOM.feelsLike.textContent = Math.round(feels);
  DOM.unit.textContent = AppState.isFahrenheit ? "F" : "C";

  // Dynamic icon and condition (handles day vs night)
  DOM.condition.textContent = getCondition(current.weather_code);
  const iconName = getLucideIcon(current.weather_code, isDay);
  DOM.weatherIconContainer.innerHTML = `<i data-lucide="${iconName}" id="weatherIcon"></i>`;

  // Stats Grid
  DOM.humidity.textContent = `${current.relative_humidity_2m}%`;
  DOM.wind.textContent = `${Math.round(current.wind_speed_10m)} km/h`;
  DOM.windDirection.textContent = `${current.wind_direction_10m}°`;
  DOM.visibility.textContent = `${(current.visibility / 1000).toFixed(1)} km`;

  const daily = data.daily;
  DOM.rain.textContent = `${daily.precipitation_probability_max[0]}%`;
  DOM.uv.textContent = daily.uv_index_max[0] ?? "--";
  DOM.sunrise.textContent = formatTime(daily.sunrise[0]);
  DOM.sunset.textContent = formatTime(daily.sunset[0]);

  createHourly(data);
  createForecast(data);

  // Re-run Lucide Icons to turn <i> tags into SVG icons
  if (window.lucide) {
    lucide.createIcons();
  }
}

// Hourly Forecast Carousel
function createHourly(data) {
  DOM.hourlyContainer.innerHTML = "";

  const currentHour = new Date().getHours();
  let startIndex = 0;

  for (let i = 0; i < data.hourly.time.length; i++) {
    const hour = new Date(data.hourly.time[i]).getHours();
    if (hour >= currentHour) {
      startIndex = i;
      break;
    }
  }

  const fragment = document.createDocumentFragment();
  for (let i = startIndex; i < startIndex + 12 && i < data.hourly.time.length; i++) {
    let temp = data.hourly.temperature_2m[i];
    if (AppState.isFahrenheit) temp = celsiusToFahrenheit(temp);

    const isDay = data.hourly.is_day ? data.hourly.is_day[i] === 1 : true;
    const timeStr = new Date(data.hourly.time[i]).toLocaleTimeString("en-IN", {
      hour: "numeric",
      hour12: true
    });

    const card = document.createElement("div");
    card.className = "hour-card";
    card.innerHTML = `
      <div class="hour-time">${timeStr}</div>
      <div class="hour-icon">
        <i data-lucide="${getLucideIcon(data.hourly.weather_code[i], isDay)}"></i>
      </div>
      <div class="hour-temp">${Math.round(temp)}°</div>
      <div class="hour-pop">
        <i data-lucide="cloud-rain" style="width: 12px; height: 12px;"></i>
        ${data.hourly.precipitation_probability[i]}%
      </div>
    `;
    fragment.appendChild(card);
  }

  DOM.hourlyContainer.appendChild(fragment);
}

// 7-Day Daily Forecast
function createForecast(data) {
  DOM.forecastContainer.innerHTML = "";
  const daily = data.daily;
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < 7; i++) {
    let max = daily.temperature_2m_max[i];
    let min = daily.temperature_2m_min[i];

    if (AppState.isFahrenheit) {
      max = celsiusToFahrenheit(max);
      min = celsiusToFahrenheit(min);
    }

    const dayName = i === 0 ? "Today" : new Date(daily.time[i]).toLocaleDateString("en-IN", { weekday: "short" });

    const card = document.createElement("div");
    card.className = "forecast-card";
    card.innerHTML = `
      <span class="forecast-day">${dayName}</span>
      <div class="forecast-center">
        <i data-lucide="${getLucideIcon(daily.weather_code[i], true)}"></i>
        <span class="forecast-rain">${daily.precipitation_probability_max[i]}%</span>
      </div>
      <div class="forecast-temp">${Math.round(max)}° <span>/ ${Math.round(min)}°</span></div>
    `;
    fragment.appendChild(card);
  }

  DOM.forecastContainer.appendChild(fragment);
}

// ==========================================================================
// GEOLOCATION (BROWSER API)
// ==========================================================================
function useLocation() {
  if (!navigator.geolocation) {
    showError("Geolocation is not supported by your browser.");
    return;
  }

  DOM.locationBtn.innerHTML = `<i data-lucide="loader-2" class="spin"></i> Locating...`;
  if (window.lucide) lucide.createIcons();

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      let locName = "Current Location";

      try {
        const revRes = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
        );
        if (revRes.ok) {
          const revData = await revRes.json();
          locName = revData.locality || revData.city || revData.principalSubdivision || "Current Location";
        }
      } catch {}

      await getWeather(lat, lon, locName);
      DOM.locationBtn.innerHTML = `<i data-lucide="map-pin"></i> Use My Current Location`;
      if (window.lucide) lucide.createIcons();
    },
    (err) => {
      DOM.locationBtn.innerHTML = `<i data-lucide="map-pin"></i> Use My Current Location`;
      if (window.lucide) lucide.createIcons();
      showError(err.code === 1 ? "Location access denied. Please type your city above." : "Location unavailable.");
    },
    { timeout: 10000, enableHighAccuracy: true }
  );
}

// ==========================================================================
// FAVORITES (LOCAL STORAGE PERSISTENCE)
// ==========================================================================
function addFavorite() {
  if (!AppState.currentCity || AppState.currentCity === "Current Location") return;

  const favorites = getStoredFavorites();
  if (!favorites.includes(AppState.currentCity)) {
    favorites.push(AppState.currentCity);
    localStorage.setItem("weather_favs", JSON.stringify(favorites));
    renderFavorites();
  }
}

function removeFavorite(city, e) {
  e.stopPropagation();
  let favorites = getStoredFavorites();
  favorites = favorites.filter((c) => c !== city);
  localStorage.setItem("weather_favs", JSON.stringify(favorites));
  renderFavorites();
}

function renderFavorites() {
  DOM.favoritesContainer.innerHTML = "";
  const favorites = getStoredFavorites();

  if (favorites.length === 0) {
    DOM.favoritesContainer.innerHTML = `<span style="font-size: 0.85rem; color: var(--text-muted);">No pinned cities yet. Click "+ Pin Current City" above.</span>`;
    return;
  }

  const fragment = document.createDocumentFragment();
  favorites.forEach((city) => {
    const chip = document.createElement("div");
    chip.className = "favorite-chip";
    chip.innerHTML = `
      <i data-lucide="map-pin" style="width: 14px; height: 14px; color: #3b82f6;"></i>
      <span>${city}</span>
      <button class="remove-fav" aria-label="Remove ${city}">✕</button>
    `;

    chip.querySelector("span").addEventListener("click", () => {
      DOM.cityInput.value = city;
      searchWeather(city);
    });

    chip.querySelector(".remove-fav").addEventListener("click", (e) => removeFavorite(city, e));
    fragment.appendChild(chip);
  });

  DOM.favoritesContainer.appendChild(fragment);
  if (window.lucide) lucide.createIcons();
}

function getStoredFavorites() {
  try {
    return JSON.parse(localStorage.getItem("weather_favs")) || [];
  } catch {
    return [];
  }
}

// ==========================================================================
// THEME HANDLING
// ==========================================================================
function initTheme() {
  const savedTheme = localStorage.getItem("theme") || "dark";
  document.documentElement.setAttribute("data-theme", savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme") || "dark";
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);
  updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
  const icon = document.getElementById("themeIcon");
  if (!icon) return;
  icon.setAttribute("data-lucide", theme === "dark" ? "sun" : "moon");
  if (window.lucide) lucide.createIcons();
}

// ==========================================================================
// WMO WEATHER CODES & HELPERS
// ==========================================================================
function getLucideIcon(code, isDay = true) {
  if (code === 0) return isDay ? "sun" : "moon";
  if (code === 1 || code === 2) return isDay ? "cloud-sun" : "cloud-moon";
  if (code === 3) return "cloud";
  if (code <= 48) return "cloud-fog";
  if (code <= 67) return "cloud-rain";
  if (code <= 77) return "snowflake";
  if (code <= 82) return "cloud-drizzle";
  if (code >= 95) return "cloud-lightning";
  return "cloud";
}

function getCondition(code) {
  const conditions = {
    0: "Clear Sky",
    1: "Mainly Clear",
    2: "Partly Cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Depositing Rime Fog",
    51: "Light Drizzle",
    53: "Moderate Drizzle",
    55: "Dense Drizzle",
    61: "Slight Rain",
    63: "Moderate Rain",
    65: "Heavy Rain",
    71: "Slight Snow Fall",
    73: "Moderate Snow Fall",
    75: "Heavy Snow Fall",
    80: "Slight Rain Showers",
    81: "Moderate Rain Showers",
    82: "Violent Rain Showers",
    95: "Thunderstorm",
    96: "Thunderstorm with Slight Hail",
    99: "Thunderstorm with Heavy Hail"
  };
  return conditions[code] || "Variable Conditions";
}

function celsiusToFahrenheit(c) {
  return (c * 9) / 5 + 32;
}

function formatTime(isoString) {
  if (!isoString) return "--:--";
  return new Date(isoString).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
}

function setLoadingState(isLoading) {
  const searchBtn = document.getElementById("searchBtn");
  if (isLoading) {
    searchBtn.disabled = true;
    searchBtn.textContent = "Searching...";
    DOM.weatherSection.style.opacity = "0.6";
  } else {
    searchBtn.disabled = false;
    searchBtn.textContent = "Search";
    DOM.weatherSection.style.opacity = "1";
  }
}

function showError(msg) {
  DOM.errorBanner.textContent = msg;
  DOM.errorBanner.classList.remove("hidden");
}

function clearError() {
  DOM.errorBanner.textContent = "";
  DOM.errorBanner.classList.add("hidden");
}
