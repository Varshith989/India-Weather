// ==========================================================================
// STATE MANAGEMENT & DOM CACHE
// ==========================================================================
const AppState = {
  currentData: null,
  currentCity: "",
  isFahrenheit: false,
  activeSuggestionIndex: -1,
  debounceTimer: null,
  geocodeAbortController: null,
};

const DOM = {
  cityInput: document.getElementById("cityInput"),
  searchBtn: document.getElementById("searchBtn"),
  clearInputBtn: document.getElementById("clearInputBtn"),
  locationBtn: document.getElementById("locationBtn"),
  themeBtn: document.getElementById("themeBtn"),
  unitBtn: document.getElementById("unitBtn"),
  favoriteBtn: document.getElementById("favoriteBtn"),
  suggestionsBox: document.getElementById("suggestions"),
  loadingBanner: document.getElementById("loading"),
  errorBanner: document.getElementById("error"),
  weatherSection: document.getElementById("weather"),

  // Data anchors
  cityName: document.getElementById("cityName"),
  dateText: document.getElementById("dateText"),
  temperature: document.getElementById("temperature"),
  feelsLike: document.getElementById("feelsLike"),
  unit: document.getElementById("unit"),
  condition: document.getElementById("condition"),
  weatherIcon: document.getElementById("weatherIcon"),
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

  // Load Bengaluru initially (or change to Hyderabad)
  DOM.cityInput.value = "Bengaluru";
  searchWeather("Bengaluru");
});

// ==========================================================================
// EVENT LISTENERS & KEYBOARD CONTROLS
// ==========================================================================
function setupEventListeners() {
  DOM.searchBtn.addEventListener("click", () => {
    closeSuggestions();
    searchWeather();
  });

  DOM.cityInput.addEventListener("keydown", (e) => {
    const items = DOM.suggestionsBox.querySelectorAll(".suggestion-item");

    if (e.key === "Enter") {
      if (AppState.activeSuggestionIndex > -1 && items[AppState.activeSuggestionIndex]) {
        items[AppState.activeSuggestionIndex].click();
      } else {
        closeSuggestions();
        searchWeather();
      }
    } else if (e.key === "ArrowDown" && items.length > 0) {
      e.preventDefault();
      AppState.activeSuggestionIndex = (AppState.activeSuggestionIndex + 1) % items.length;
      updateSuggestionHighlight(items);
    } else if (e.key === "ArrowUp" && items.length > 0) {
      e.preventDefault();
      AppState.activeSuggestionIndex = (AppState.activeSuggestionIndex - 1 + items.length) % items.length;
      updateSuggestionHighlight(items);
    } else if (e.key === "Escape") {
      closeSuggestions();
    }
  });

  DOM.cityInput.addEventListener("input", (e) => {
    const query = e.target.value.trim();
    DOM.clearInputBtn.classList.toggle("hidden", query.length === 0);

    clearTimeout(AppState.debounceTimer);
    AppState.activeSuggestionIndex = -1;

    if (query.length < 2) {
      closeSuggestions();
      return;
    }

    AppState.debounceTimer = setTimeout(() => {
      fetchCitySuggestions(query);
    }, 280);
  });

  DOM.clearInputBtn.addEventListener("click", () => {
    DOM.cityInput.value = "";
    DOM.clearInputBtn.classList.add("hidden");
    closeSuggestions();
    DOM.cityInput.focus();
  });

  document.addEventListener("click", (e) => {
    if (!DOM.suggestionsBox.contains(e.target) && e.target !== DOM.cityInput) {
      closeSuggestions();
    }
  });

  DOM.themeBtn.addEventListener("click", toggleTheme);

  DOM.unitBtn.addEventListener("click", () => {
    AppState.isFahrenheit = !AppState.isFahrenheit;
    DOM.unitBtn.textContent = AppState.isFahrenheit ? "°F" : "°C";

    if (AppState.currentData) {
      displayWeather(AppState.currentData.data, AppState.currentData.city);
    }
  });

  DOM.favoriteBtn.addEventListener("click", addFavorite);
  DOM.locationBtn.addEventListener("click", useLocation);
}

// ==========================================================================
// SEARCH & AUTOCOMPLETE
// ==========================================================================
async function fetchCitySuggestions(query) {
  if (AppState.geocodeAbortController) {
    AppState.geocodeAbortController.abort();
  }
  AppState.geocodeAbortController = new AbortController();

  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json&countryCode=IN`;
    const res = await fetch(url, { signal: AppState.geocodeAbortController.signal });
    const data = await res.json();

    if (!data.results || data.results.length === 0) {
      closeSuggestions();
      return;
    }

    DOM.suggestionsBox.innerHTML = "";
    data.results.forEach((place) => {
      const item = document.createElement("div");
      item.className = "suggestion-item";
      const region = place.admin1 ? `${place.admin1}, ` : "";

      item.innerHTML = `
        <div>
          <strong>${place.name}</strong>
          <span style="font-size: 12px; color: var(--muted); margin-left: 4px;">${region}India</span>
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
    if (err.name !== "AbortError") closeSuggestions();
  }
}

function updateSuggestionHighlight(items) {
  items.forEach((item, idx) => {
    item.classList.toggle("selected", idx === AppState.activeSuggestionIndex);
  });
}

function closeSuggestions() {
  DOM.suggestionsBox.innerHTML = "";
  DOM.suggestionsBox.classList.add("hidden");
  AppState.activeSuggestionIndex = -1;
}

// ==========================================================================
// WEATHER DATA RETRIEVAL
// ==========================================================================
async function searchWeather(customCity = null) {
  const city = (customCity || DOM.cityInput.value).trim();
  if (!city) {
    showError("Please enter an Indian city or district.");
    return;
  }

  showLoading(true);
  clearError();

  try {
    // 1. Search with India countryCode filter
    let url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=5&language=en&format=json&countryCode=IN`;
    let res = await fetch(url);
    let data = await res.json();

    // 2. Global fallback search if strict India geocode yields 0 results
    if (!data.results || data.results.length === 0) {
      url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=5&language=en&format=json`;
      res = await fetch(url);
      data = await res.json();
    }

    if (!data.results || data.results.length === 0) {
      throw new Error(`Location "${city}" not found. Please verify spelling.`);
    }

    const loc = data.results[0];
    await getWeather(loc.latitude, loc.longitude, loc.name);
  } catch (err) {
    showError(err.message || "Failed to locate city.");
  } finally {
    showLoading(false);
  }
}

async function getWeather(latitude, longitude, cityName) {
  showLoading(true);
  clearError();

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m,visibility&hourly=temperature_2m,weather_code,precipitation_probability,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max,sunrise,sunset&timezone=auto`;

    const res = await fetch(url);
    if (!res.ok) throw new Error("Weather service unreachable.");

    const data = await res.json();

    AppState.currentData = { data, city: cityName };
    AppState.currentCity = cityName;

    DOM.weatherSection.style.display = "block";
    displayWeather(data, cityName);
  } catch (err) {
    showError("Could not retrieve weather forecast. Please retry.");
  } finally {
    showLoading(false);
  }
}

// ==========================================================================
// RENDER WEATHER DASHBOARD
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

  DOM.condition.textContent = getCondition(current.weather_code);
  DOM.weatherIcon.textContent = getEmojiIcon(current.weather_code, isDay);

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
}

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
      <div class="hour-icon">${getEmojiIcon(data.hourly.weather_code[i], isDay)}</div>
      <div class="hour-temp">${Math.round(temp)}°</div>
      <small>🌧️ ${data.hourly.precipitation_probability[i]}%</small>
    `;
    fragment.appendChild(card);
  }

  DOM.hourlyContainer.appendChild(fragment);
}

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
      <strong>${dayName}</strong>
      <div class="forecast-icon">${getEmojiIcon(daily.weather_code[i], true)}</div>
      <div class="forecast-temp">${Math.round(max)}° / ${Math.round(min)}°</div>
      <div class="forecast-rain">💧 ${daily.precipitation_probability_max[i]}%</div>
    `;
    fragment.appendChild(card);
  }

  DOM.forecastContainer.appendChild(fragment);
}

// ==========================================================================
// GEOLOCATION
// ==========================================================================
function useLocation() {
  if (!navigator.geolocation) {
    showError("Geolocation is not supported by your browser.");
    return;
  }

  DOM.locationBtn.innerHTML = `⏳ Locating...`;

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
      DOM.locationBtn.innerHTML = `📍 Use My Current Location`;
    },
    (err) => {
      DOM.locationBtn.innerHTML = `📍 Use My Current Location`;
      showError(err.code === 1 ? "Location permission denied. Please search your city above." : "Unable to retrieve location.");
    },
    { timeout: 10000, enableHighAccuracy: true }
  );
}

// ==========================================================================
// FAVORITES (LOCAL STORAGE)
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
    DOM.favoritesContainer.innerHTML = `<span style="font-size: 13px; color: var(--muted);">No pinned cities yet.</span>`;
    return;
  }

  favorites.forEach((city) => {
    const chip = document.createElement("div");
    chip.className = "favorite-chip";
    chip.innerHTML = `
      <span>❤️ ${city}</span>
      <button class="remove-fav" aria-label="Remove ${city}">✕</button>
    `;

    chip.querySelector("span").addEventListener("click", () => {
      DOM.cityInput.value = city;
      searchWeather(city);
    });

    chip.querySelector(".remove-fav").addEventListener("click", (e) => removeFavorite(city, e));
    DOM.favoritesContainer.appendChild(chip);
  });
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
  const isDark = localStorage.getItem("theme") === "dark";
  document.body.classList.toggle("dark", isDark);
  DOM.themeBtn.textContent = isDark ? "☀️" : "🌙";
}

function toggleTheme() {
  const isDark = document.body.classList.toggle("dark");
  DOM.themeBtn.textContent = isDark ? "☀️" : "🌙";
  localStorage.setItem("theme", isDark ? "dark" : "light");
}

// ==========================================================================
// HELPERS & WMO WEATHER CODES
// ==========================================================================
function getEmojiIcon(code, isDay = true) {
  if (code === 0) return isDay ? "☀️" : "🌙";
  if (code <= 3) return isDay ? "⛅" : "☁️";
  if (code <= 48) return "🌫️";
  if (code <= 67) return "🌧️";
  if (code <= 77) return "❄️";
  if (code <= 82) return "🌦️";
  if (code >= 95) return "⛈️";
  return "🌤️";
}

function getCondition(code) {
  if (code === 0) return "Clear Sky";
  if (code <= 3) return "Partly Cloudy";
  if (code <= 48) return "Foggy / Hazy";
  if (code <= 67) return "Rainy";
  if (code <= 77) return "Snow";
  if (code <= 82) return "Showers";
  if (code >= 95) return "Thunderstorm";
  return "Variable Conditions";
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

function showLoading(show) {
  DOM.loadingBanner.classList.toggle("hidden", !show);
}

function showError(msg) {
  DOM.errorBanner.textContent = msg;
  DOM.errorBanner.classList.remove("hidden");
}

function clearError() {
  DOM.errorBanner.textContent = "";
  DOM.errorBanner.classList.add("hidden");
}
