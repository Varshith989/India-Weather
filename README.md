# 🇮🇳 IndiaWeather Pro

> A cutting-edge, high-precision Weather Intelligence & Air Quality platform engineered specifically for the Indian subcontinent.

![IndiaWeather Pro](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue?style=flat-square&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?style=flat-square&logo=tailwindcss)
![Vite](https://img.shields.io/badge/Vite-8.3-646cff?style=flat-square&logo=vite)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## ✨ Features & Advancements

### 🍃 National Air Quality Index (NAQI) Telemetry
* **CPCB 6-Category Standard**: Real-time evaluation of Indian National AQI based on official Central Pollution Control Board breakpoints.
* **Pollutant Breakdown**: Dedicated metrics for $\text{PM}_{2.5}$, $\text{PM}_{10}$, $\text{Ozone}$, and $\text{NO}_2$.
* **Health Advisories**: Contextual safety guidelines including N95 mask usage, indoor air purifier recommendations, and safe outdoor exercise windows.

### 🌀 Animated Live Doppler Radar Loop Player
* **13-Frame Time Loop**: Animates radar rain clouds moving across the Indian peninsula over the past 2 hours.
* **Playback Controls**: Full interactive timeline scrubber with `Play`, `Pause`, timestamp displays, and a `LIVE` indicator.
* **Safe Scaling**: Leaflet mapping with `maxNativeZoom` limits ensuring crisp visuals without tile errors.

### 📮 Indian Postal PIN Code Geocoding
* Instant search by **6-digit Postal PIN Code** (e.g. `500081`, `110001`, `600028`) or city name.
* Resolves directly to the local post office, district, and state.

### 🎙️ Indian Natural Voice Weather Briefing (English & Hindi)
* **Bilingual Speech Synthesis**: Instant spoken weather briefings in both **Natural Indian English (en-IN)** and **Natural Indian Hindi (hi-IN)**.
* **Neural Voice Priority**: Automatically leverages top-tier natural/neural voices (e.g. `Microsoft Neerja Online (Natural)`, `Microsoft Prabhat`, `Microsoft Swara Online (Natural)`, `Google हिन्दी`, `Google English (India)`).
* **Zero-Error Resilient Engine**: Built-in immunity against browser speech interrupts, Chromium garbage-collection cutoffs, and network glitches with automatic seamless fallbacks.

### 🌡️ Wet Bulb Temperature & Heat Stress
* Thermodynamic wet bulb computation (Stull's formula) combining ambient heat with extreme Indian monsoon humidity.

### ⚠️ IMD-Style Extreme Weather Alerts
* Dynamic warnings for heatwaves, severe cold waves, squalls, and heavy rainfall.

### 🌐 Bilingual Localization
* Instant language switching:
  * **English (EN)**
  * **हिन्दी (HI)**

### 🌓 Seamless Dual-Theme (Light & Dark Mode)
* Full light and dark mode styling with smooth transitions, glassmorphic cards, and custom scrollbars.

---

## 🛠️ Tech Stack

* **Frontend Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
* **Build Tool**: [Vite 8](https://vite.dev/)
* **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
* **Icons**: [Lucide React](https://lucide.dev/)
* **Maps & Radar**: [Leaflet](https://leafletjs.com/) + [RainViewer API](https://www.rainviewer.com/api.html)
* **Meteorological Telemetry**: [Open-Meteo Weather API](https://open-meteo.com/) & [Air Quality API](https://air-quality-api.open-meteo.com/)
* **Postal Geocoding**: [India Post API](https://api.postalpincode.in/)

---

## 🚀 Getting Started

### Prerequisites
* Node.js (v18 or higher)
* npm

### Installation

```bash
# Clone the repository
git clone https://github.com/Varshith989/India-Weather.git

# Navigate to project directory
cd India-Weather

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build

```bash
npm run build
```

---

## 📄 License

This project is licensed under the MIT License.
