let currentData = null;
let currentCity = "";
let isFahrenheit = false;

const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const locationBtn = document.getElementById("locationBtn");
const themeBtn = document.getElementById("themeBtn");
const unitBtn = document.getElementById("unitBtn");
const favoriteBtn = document.getElementById("favoriteBtn");

searchBtn.addEventListener("click", searchWeather);

cityInput.addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    searchWeather();
  }
});

themeBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark");

  themeBtn.textContent =
    document.body.classList.contains("dark") ? "☀️" : "🌙";
});

unitBtn.addEventListener("click", () => {
  isFahrenheit = !isFahrenheit;

  unitBtn.textContent = isFahrenheit ? "°F" : "°C";

  if (currentData) {
    displayWeather(
      currentData.data,
      currentData.city
    );
  }
});

favoriteBtn.addEventListener("click", addFavorite);

locationBtn.addEventListener("click", useLocation);


// =============================
// SEARCH CITY
// =============================

async function searchWeather() {

  const city = cityInput.value.trim();

  if (!city) {
    showError("Please enter an Indian city.");
    return;
  }

  showLoading(true);
  clearError();

  try {

    const url =
      `https://geocoding-api.open-meteo.com/v1/search` +
      `?name=${encodeURIComponent(city)}` +
      `&count=5` +
      `&language=en` +
      `&format=json` +
      `&countryCode=IN`;

    const response = await fetch(url);

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      throw new Error("City not found");
    }

    const location = data.results[0];

    await getWeather(
      location.latitude,
      location.longitude,
      location.name
    );

  } catch (error) {

    showError(
      "Indian city not found. Try another city."
    );

  } finally {

    showLoading(false);

  }
}


// =============================
// GET WEATHER
// =============================

async function getWeather(
  latitude,
  longitude,
  city
) {

  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${latitude}` +
    `&longitude=${longitude}` +
    `&current=` +
    `temperature_2m,relative_humidity_2m,` +
    `apparent_temperature,precipitation,` +
    `weather_code,wind_speed_10m,` +
    `wind_direction_10m,visibility` +
    `&hourly=` +
    `temperature_2m,weather_code,` +
    `precipitation_probability` +
    `&daily=` +
    `weather_code,temperature_2m_max,` +
    `temperature_2m_min,` +
    `precipitation_probability_max,` +
    `uv_index_max,sunrise,sunset` +
    `&timezone=auto`;

  const response = await fetch(url);

  const data = await response.json();

  currentData = {
    data: data,
    city: city
  };

  currentCity = city;

  displayWeather(data, city);

}


// =============================
// DISPLAY WEATHER
// =============================

function displayWeather(data, city) {

  document.getElementById("weather").style.display = "block";

  document.getElementById("cityName").textContent = city;

  document.getElementById("dateText").textContent =
    new Date().toLocaleDateString(
      "en-IN",
      {
        weekday: "long",
        day: "numeric",
        month: "long"
      }
    );


  const current = data.current;

  let temp = current.temperature_2m;
  let feels = current.apparent_temperature;

  if (isFahrenheit) {
    temp = celsiusToFahrenheit(temp);
    feels = celsiusToFahrenheit(feels);
  }


  document.getElementById("temperature").textContent =
    Math.round(temp);

  document.getElementById("feelsLike").textContent =
    Math.round(feels);

  document.getElementById("unit").textContent =
    isFahrenheit ? "F" : "C";


  document.getElementById("condition").textContent =
    getCondition(current.weather_code);

  document.getElementById("weatherIcon").textContent =
    getIcon(current.weather_code);


  document.getElementById("humidity").textContent =
    current.relative_humidity_2m + "%";

  document.getElementById("wind").textContent =
    Math.round(current.wind_speed_10m) + " km/h";

  document.getElementById("windDirection").textContent =
    current.wind_direction_10m + "°";

  document.getElementById("visibility").textContent =
    (current.visibility / 1000).toFixed(1) + " km";


  const daily = data.daily;

  document.getElementById("rain").textContent =
    daily.precipitation_probability_max[0] + "%";

  document.getElementById("uv").textContent =
    daily.uv_index_max[0];


  document.getElementById("sunrise").textContent =
    formatTime(daily.sunrise[0]);

  document.getElementById("sunset").textContent =
    formatTime(daily.sunset[0]);


  createHourly(data);

  createForecast(data);

}


// =============================
// HOURLY FORECAST
// =============================

function createHourly(data) {

  const container =
    document.getElementById("hourly");

  container.innerHTML = "";

  const currentHour =
    new Date().getHours();

  let startIndex = 0;

  for (
    let i = 0;
    i < data.hourly.time.length;
    i++
  ) {

    const hour =
      new Date(data.hourly.time[i]).getHours();

    if (hour >= currentHour) {
      startIndex = i;
      break;
    }

  }


  for (
    let i = startIndex;
    i < startIndex + 12 &&
    i < data.hourly.time.length;
    i++
  ) {

    let temp =
      data.hourly.temperature_2m[i];

    if (isFahrenheit) {
      temp = celsiusToFahrenheit(temp);
    }

    const time =
      new Date(data.hourly.time[i])
        .toLocaleTimeString(
          "en-IN",
          {
            hour: "numeric"
          }
        );


    const card =
      document.createElement("div");

    card.className = "hour-card";

    card.innerHTML = `

      <div class="hour-time">
        ${time}
      </div>

      <div class="hour-icon">
        ${getIcon(data.hourly.weather_code[i])}
      </div>

      <div class="hour-temp">
        ${Math.round(temp)}°
      </div>

      <small>
        🌧️ ${data.hourly.precipitation_probability[i]}%
      </small>

    `;

    container.appendChild(card);

  }

}


// =============================
// 7 DAY FORECAST
// =============================

function createForecast(data) {

  const container =
    document.getElementById("forecast");

  container.innerHTML = "";

  const daily = data.daily;


  for (let i = 0; i < 7; i++) {

    let max =
      daily.temperature_2m_max[i];

    let min =
      daily.temperature_2m_min[i];


    if (isFahrenheit) {

      max = celsiusToFahrenheit(max);
      min = celsiusToFahrenheit(min);

    }


    const day =
      new Date(daily.time[i])
        .toLocaleDateString(
          "en-IN",
          {
            weekday: "long"
          }
        );


    const card =
      document.createElement("div");

    card.className = "forecast-card";

    card.innerHTML = `

      <strong>
        ${i === 0 ? "Today" : day}
      </strong>

      <div class="forecast-icon">
        ${getIcon(daily.weather_code[i])}
      </div>

      <div class="forecast-temp">
        ${Math.round(max)}° /
        ${Math.round(min)}°
      </div>

      <div class="forecast-rain">
        💧 ${daily.precipitation_probability_max[i]}%
      </div>

    `;

    container.appendChild(card);

  }

}


// =============================
// CURRENT LOCATION
// =============================

function useLocation() {

  if (!navigator.geolocation) {

    showError(
      "Location is not supported by your browser."
    );

    return;

  }

  showLoading(true);

  navigator.geolocation.getCurrentPosition(

    async function(position) {

      try {

        await getWeather(
          position.coords.latitude,
          position.coords.longitude,
          "Your Location"
        );

      } catch {

        showError(
          "Could not get weather."
        );

      }

      showLoading(false);

    },

    function() {

      showLoading(false);

      showError(
        "Please allow location access."
      );

    }

  );

}


// =============================
// FAVORITES
// =============================

function addFavorite() {

  if (!currentCity) return;

  let favorites =
    JSON.parse(
      localStorage.getItem("favorites")
    ) || [];


  if (!favorites.includes(currentCity)) {

    favorites.push(currentCity);

    localStorage.setItem(
      "favorites",
      JSON.stringify(favorites)
    );

  }

  renderFavorites();

}


function renderFavorites() {

  const container =
    document.getElementById("favorites");

  container.innerHTML = "";

  const favorites =
    JSON.parse(
      localStorage.getItem("favorites")
    ) || [];


  favorites.forEach(city => {

    const card =
      document.createElement("div");

    card.className =
      "favorite-card";

    card.textContent =
      "❤️ " + city;

    card.onclick = () => {

      cityInput.value = city;

      searchWeather();

    };

    container.appendChild(card);

  });

}


// =============================
// WEATHER HELPERS
// =============================

function getIcon(code) {

  if (code === 0)
    return "☀️";

  if (code <= 3)
    return "⛅";

  if (code <= 48)
    return "🌫️";

  if (code <= 67)
    return "🌧️";

  if (code <= 77)
    return "❄️";

  if (code <= 82)
    return "🌦️";

  if (code >= 95)
    return "⛈️";

  return "🌤️";

}


function getCondition(code) {

  if (code === 0)
    return "Clear Sky";

  if (code <= 3)
    return "Partly Cloudy";

  if (code <= 48)
    return "Foggy";

  if (code <= 67)
    return "Rainy";

  if (code <= 77)
    return "Snow";

  if (code <= 82)
    return "Showers";

  if (code >= 95)
    return "Thunderstorm";

  return "Unknown";

}


function celsiusToFahrenheit(c) {

  return (c * 9 / 5) + 32;

}


function formatTime(time) {

  return new Date(time)
    .toLocaleTimeString(
      "en-IN",
      {
        hour: "2-digit",
        minute: "2-digit"
      }
    );

}


function showLoading(show) {

  document.getElementById("loading")
    .style.display =
    show ? "block" : "none";

}


function showError(message) {

  document.getElementById("error")
    .textContent = message;

}


function clearError() {

  document.getElementById("error")
    .textContent = "";

}


// Load favorites
renderFavorites();

// Load Hyderabad initially
cityInput.value = "Hyderabad";
searchWeather();