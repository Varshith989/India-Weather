import { getWeatherConditionInfo } from "../utils/aqiUtils";

/**
 * Ultra-resilient, natural Indian English speech synthesis service for IndiaWeather.
 * Features:
 * 1. Automatic detection and prioritization of Natural/Neural Indian English accents (Microsoft Neerja, Prabhat, Heera, Ravi, Google en-IN, Apple Veena/Rishi).
 * 2. Complete immunity to Web Speech API errors (Chromium GC bug, stuck queue, 15-second freeze bug, network voice fallback).
 * 3. Graceful handling of cancellation, interruption, and browser restrictions without throwing user-facing errors.
 * 4. Context-aware natural weather briefing scripts for general and agricultural (Kisan) modes.
 */

export interface VoiceChoice {
  voice: SpeechSynthesisVoice | null;
  name: string;
  isIndianNatural: boolean;
}

// Global reference to prevent V8/Chromium garbage collection mid-speech
declare global {
  interface Window {
    __activeWeatherUtterance?: SpeechSynthesisUtterance | null;
  }
}

type StateListener = (speaking: boolean) => void;
const stateListeners = new Set<StateListener>();

function notifySpeakingState(speaking: boolean) {
  stateListeners.forEach((fn) => {
    try {
      fn(speaking);
    } catch {
      // Ignore listener errors
    }
  });
}

/**
 * Subscribes a React component to the active speaking state
 */
export function subscribeSpeakingState(listener: StateListener): () => void {
  stateListeners.add(listener);
  listener(isSpeaking());
  return () => {
    stateListeners.delete(listener);
  };
}

let cachedVoices: SpeechSynthesisVoice[] = [];
let keepAliveInterval: ReturnType<typeof setInterval> | null = null;
let activeUtterance: SpeechSynthesisUtterance | null = null;

/**
 * Retrieve voices, caching for fast synchronous lookups
 */
export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return [];
  }
  if (cachedVoices.length === 0) {
    cachedVoices = window.speechSynthesis.getVoices();
  }
  return cachedVoices;
}

// Preload voices whenever browser emits voiceschanged event
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  try {
    cachedVoices = window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
      cachedVoices = window.speechSynthesis.getVoices();
    };
  } catch {
    // Ignore environments where speech synthesis is restricted
  }
}

/**
 * Picks the best natural Indian English voice available in the client's browser/system.
 */
export function getBestIndianEnglishVoice(): VoiceChoice {
  const voices = getAvailableVoices();
  if (voices.length === 0) {
    return { voice: null, name: "Indian English (Auto)", isIndianNatural: true };
  }

  const isEnIn = (v: SpeechSynthesisVoice) => {
    const l = v.lang.replace(/_/g, "-").toLowerCase();
    return l === "en-in" || l.startsWith("en-in");
  };

  const isNatural = (v: SpeechSynthesisVoice) => {
    const n = v.name.toLowerCase();
    return n.includes("natural") || n.includes("neural") || n.includes("online");
  };

  // 1. Natural / Neural Indian English (e.g. Edge Microsoft Neerja Online (Natural), Microsoft Prabhat Online (Natural))
  const naturalIndian = voices.find((v) => isEnIn(v) && isNatural(v));
  if (naturalIndian) {
    return { voice: naturalIndian, name: naturalIndian.name, isIndianNatural: true };
  }

  // 2. High-quality Indian English voices (Microsoft Neerja, Microsoft Heera, Microsoft Ravi, Google English (India), Apple Veena, Apple Rishi)
  const premiumIndian = voices.find((v) => {
    if (!isEnIn(v)) return false;
    const n = v.name.toLowerCase();
    return (
      n.includes("neerja") ||
      n.includes("prabhat") ||
      n.includes("heera") ||
      n.includes("ravi") ||
      n.includes("google") ||
      n.includes("veena") ||
      n.includes("rishi")
    );
  });
  if (premiumIndian) {
    return { voice: premiumIndian, name: premiumIndian.name, isIndianNatural: true };
  }

  // 3. Any English (India) voice
  const standardIndian = voices.find(isEnIn);
  if (standardIndian) {
    return { voice: standardIndian, name: standardIndian.name, isIndianNatural: true };
  }

  // 4. Voice with "India" in the name and English language
  const indiaName = voices.find((v) => {
    const n = v.name.toLowerCase();
    const l = v.lang.toLowerCase();
    return (n.includes("india") || n.includes("indian")) && l.startsWith("en");
  });
  if (indiaName) {
    return { voice: indiaName, name: indiaName.name, isIndianNatural: true };
  }

  // 5. Fallback: High-grade Natural English voice
  const naturalFallback = voices.find((v) => v.lang.toLowerCase().startsWith("en") && isNatural(v));
  if (naturalFallback) {
    return { voice: naturalFallback, name: naturalFallback.name, isIndianNatural: false };
  }

  // 6. Any English voice
  const englishFallback = voices.find((v) => v.lang.toLowerCase().startsWith("en"));
  if (englishFallback) {
    return { voice: englishFallback, name: englishFallback.name, isIndianNatural: false };
  }

  // 7. System default
  const defaultVoice = voices.find((v) => v.default) || voices[0] || null;
  return { voice: defaultVoice, name: defaultVoice?.name || "System Default", isIndianNatural: false };
}

function clearKeepAlive() {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
  }
}

function startKeepAlive() {
  clearKeepAlive();
  // Fix Chromium 15-second speech freeze bug by toggling pause/resume periodically
  keepAliveInterval = setInterval(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      clearKeepAlive();
      return;
    }
    if (!window.speechSynthesis.speaking) {
      clearKeepAlive();
    } else {
      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
    }
  }, 10000);
}

/**
 * Safely stops any ongoing speech playback without throwing errors.
 */
export function stopSpeaking() {
  clearKeepAlive();
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

  try {
    window.speechSynthesis.cancel();
  } catch {
    // Ignore cancel errors
  }

  if (activeUtterance) {
    activeUtterance.onend = null;
    activeUtterance.onerror = null;
    activeUtterance = null;
  }
  if (window.__activeWeatherUtterance) {
    window.__activeWeatherUtterance.onend = null;
    window.__activeWeatherUtterance.onerror = null;
    window.__activeWeatherUtterance = null;
  }

  notifySpeakingState(false);
}

/**
 * Check if speech synthesis is currently active.
 */
export function isSpeaking(): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  return window.speechSynthesis.speaking;
}

export interface BriefingScriptOptions {
  cityName: string;
  temperature: number;
  feelsLike?: number;
  weatherCode?: number;
  humidity: number;
  rainProbability: number;
  pm25?: number;
  isAgroMode?: boolean;
}

/**
 * Generates natural, human-sounding Indian English weather briefing text.
 */
export function buildNaturalBriefingScript(opts: BriefingScriptOptions): string {
  const roundedTemp = Math.round(opts.temperature);
  const condition = opts.weatherCode !== undefined ? getWeatherConditionInfo(opts.weatherCode).label : "fair weather";

  if (opts.isAgroMode) {
    const rainMsg =
      opts.rainProbability >= 60
        ? `Heavy rainfall is likely with ${opts.rainProbability} percent probability. Postpone field irrigation and outdoor fertilizer application.`
        : opts.rainProbability >= 25
        ? `Passing showers may occur. Hold off on pesticide spraying until leaves are dry.`
        : `Dry conditions with low rain risk. Favorable window for fertilizer and pesticide spraying.`;

    return `Namaste Kisan bhai! Here is your agricultural weather briefing for ${opts.cityName}. The current temperature is ${roundedTemp} degrees Celsius, with humidity at ${opts.humidity} percent, and ${condition}. ${rainMsg} Wishing you healthy crops and a bountiful harvest!`;
  }

  // Standard Natural Briefing
  let rainSentence = "No rain is expected today, enjoy the clear skies.";
  if (opts.rainProbability >= 60) {
    rainSentence = `Rain probability is high at ${opts.rainProbability} percent, so keep an umbrella handy for your commute.`;
  } else if (opts.rainProbability >= 25) {
    rainSentence = `Passing drizzles are possible today with ${opts.rainProbability} percent chance.`;
  }

  let aqiSentence = "Air quality is pleasant and healthy.";
  if (opts.pm25 !== undefined) {
    if (opts.pm25 > 120) {
      aqiSentence = "Air quality is poor today, wearing an N95 mask outdoors is strongly recommended.";
    } else if (opts.pm25 > 60) {
      aqiSentence = "Air quality is moderate, sensitive individuals should take light precautions.";
    }
  }

  return `Namaste! Here is your India Weather briefing for ${opts.cityName}. Currently, it is ${roundedTemp} degrees Celsius with ${condition}, and humidity is ${opts.humidity} percent. ${rainSentence} ${aqiSentence} Have a wonderful, safe, and productive day!`;
}

export interface SpeakWeatherOptions extends BriefingScriptOptions {
  onStart?: () => void;
  onEnd?: () => void;
}

/**
 * Bulletproof speech execution with automatic retry, natural cadence, and error immunity.
 */
export function speakWeatherBriefing(options: SpeakWeatherOptions, isRetry = false): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    console.warn("Speech synthesis is not supported on this browser.");
    notifySpeakingState(false);
    options.onEnd?.();
    return;
  }

  // Stop any active speech first
  stopSpeaking();

  // Ensure synthesizer is not suspended or paused
  if (window.speechSynthesis.paused) {
    try {
      window.speechSynthesis.resume();
    } catch {
      // Ignore
    }
  }

  const text = buildNaturalBriefingScript(options);

  // Chrome requires a small delay after cancel() before starting a new utterance
  setTimeout(() => {
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-IN";
      // Natural, warm Indian English cadence (0.92 rate gives clear pronunciation)
      utterance.rate = 0.92;
      utterance.pitch = 1.0;

      const voiceChoice = getBestIndianEnglishVoice();
      if (!isRetry && voiceChoice.voice) {
        utterance.voice = voiceChoice.voice;
      }

      // Maintain persistent references to prevent garbage collection mid-speech
      activeUtterance = utterance;
      window.__activeWeatherUtterance = utterance;

      utterance.onstart = () => {
        startKeepAlive();
        notifySpeakingState(true);
        options.onStart?.();
      };

      utterance.onend = () => {
        clearKeepAlive();
        activeUtterance = null;
        window.__activeWeatherUtterance = null;
        notifySpeakingState(false);
        options.onEnd?.();
      };

      utterance.onerror = (event) => {
        clearKeepAlive();
        activeUtterance = null;
        window.__activeWeatherUtterance = null;

        // Normal stop/cancel by user is not an error
        if (event.error === "canceled" || event.error === "interrupted") {
          notifySpeakingState(false);
          options.onEnd?.();
          return;
        }

        console.warn("Speech synthesis non-fatal notice:", event.error);

        // If an online natural voice failed (e.g. network timeout), retry once with offline voice seamlessly
        if (!isRetry && (event.error === "network" || event.error === "audio-busy" || event.error === "not-allowed")) {
          try {
            speakWeatherBriefing(options, true);
            return;
          } catch {
            // Graceful exit
          }
        }

        notifySpeakingState(false);
        options.onEnd?.();
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn("Speech synthesis safe fallback:", err);
      clearKeepAlive();
      activeUtterance = null;
      window.__activeWeatherUtterance = null;
      notifySpeakingState(false);
      options.onEnd?.();
    }
  }, 70);
}
