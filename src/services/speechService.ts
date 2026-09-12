import { getWeatherConditionInfo } from "../utils/aqiUtils";

/**
 * Ultra-resilient, natural Indian speech synthesis service for IndiaWeather.
 * Supports:
 * - Natural Indian English (en-IN) with voices like Microsoft Neerja Online (Natural), Microsoft Prabhat, Google English (India), etc.
 * - Natural Indian Hindi (hi-IN) with voices like Microsoft Swara Online (Natural), Microsoft Madhur, Google हिन्दी, etc.
 * - Complete immunity to Web Speech API errors (Chromium GC bug, stuck queue, 15-second freeze bug, network voice fallback).
 * - Context-aware natural weather briefing scripts in both Hindi and English.
 */

export type SpeechLanguage = "en" | "hi";

export interface VoiceChoice {
  voice: SpeechSynthesisVoice | null;
  name: string;
  isNatural: boolean;
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
let currentSessionId = 0;
let pendingSpeakTimer: ReturnType<typeof setTimeout> | null = null;
let watchdogTimer: ReturnType<typeof setTimeout> | null = null;
let isSpeechActive = false;

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
 * Picks the best natural Indian voice available for either English or Hindi.
 */
export function getBestIndianVoice(targetLang: SpeechLanguage = "en"): VoiceChoice {
  const voices = getAvailableVoices();
  if (voices.length === 0) {
    return {
      voice: null,
      name: targetLang === "hi" ? "Hindi (Auto)" : "Indian English (Auto)",
      isNatural: true,
    };
  }

  const isNaturalName = (name: string) => {
    const n = name.toLowerCase();
    return n.includes("natural") || n.includes("neural") || n.includes("online");
  };

  if (targetLang === "hi") {
    // 1. Natural / Neural Hindi voices (Microsoft Swara Online Natural, Microsoft Madhur Online Natural)
    const naturalHindi = voices.find((v) => {
      const lang = v.lang.replace(/_/g, "-").toLowerCase();
      return (lang === "hi-in" || lang.startsWith("hi")) && isNaturalName(v.name);
    });
    if (naturalHindi) {
      return { voice: naturalHindi, name: naturalHindi.name, isNatural: true };
    }

    // 2. High-quality Hindi voices (Microsoft Kalpana, Microsoft Hemant, Google हिन्दी, Apple Lekha)
    const premiumHindi = voices.find((v) => {
      const lang = v.lang.replace(/_/g, "-").toLowerCase();
      const name = v.name.toLowerCase();
      const isHi = lang === "hi-in" || lang.startsWith("hi");
      return (
        isHi &&
        (name.includes("swara") ||
          name.includes("madhur") ||
          name.includes("kalpana") ||
          name.includes("hemant") ||
          name.includes("google") ||
          name.includes("lekha") ||
          name.includes("हिन्दी") ||
          name.includes("hindi"))
      );
    });
    if (premiumHindi) {
      return { voice: premiumHindi, name: premiumHindi.name, isNatural: true };
    }

    // 3. Any Hindi voice
    const anyHindi = voices.find((v) => {
      const lang = v.lang.replace(/_/g, "-").toLowerCase();
      return lang === "hi-in" || lang.startsWith("hi") || v.name.toLowerCase().includes("hindi");
    });
    if (anyHindi) {
      return { voice: anyHindi, name: anyHindi.name, isNatural: true };
    }

    // 4. Fallback for Hindi: Top Indian English voice (which pronounces Indian phonemes best)
    const fallbackIndian = getBestIndianVoice("en");
    if (fallbackIndian.voice) {
      return fallbackIndian;
    }
  } else {
    // English (India)
    const isEnIn = (v: SpeechSynthesisVoice) => {
      const l = v.lang.replace(/_/g, "-").toLowerCase();
      return l === "en-in" || l.startsWith("en-in");
    };

    // 1. Natural / Neural Indian English (Microsoft Neerja Online Natural, Microsoft Prabhat Online Natural)
    const naturalIndian = voices.find((v) => isEnIn(v) && isNaturalName(v.name));
    if (naturalIndian) {
      return { voice: naturalIndian, name: naturalIndian.name, isNatural: true };
    }

    // 2. Renowned Indian English voices (Microsoft Neerja, Microsoft Heera, Microsoft Ravi, Google English (India), Apple Veena, Apple Rishi)
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
      return { voice: premiumIndian, name: premiumIndian.name, isNatural: true };
    }

    // 3. Any English (India) voice
    const standardIndian = voices.find(isEnIn);
    if (standardIndian) {
      return { voice: standardIndian, name: standardIndian.name, isNatural: true };
    }

    // 4. Voice with "India" in the name and English language
    const indiaName = voices.find((v) => {
      const n = v.name.toLowerCase();
      const l = v.lang.toLowerCase();
      return (n.includes("india") || n.includes("indian")) && l.startsWith("en");
    });
    if (indiaName) {
      return { voice: indiaName, name: indiaName.name, isNatural: true };
    }

    // 5. Fallback: High-grade Natural English voice
    const naturalFallback = voices.find((v) => v.lang.toLowerCase().startsWith("en") && isNaturalName(v.name));
    if (naturalFallback) {
      return { voice: naturalFallback, name: naturalFallback.name, isNatural: false };
    }

    // 6. Any English voice
    const englishFallback = voices.find((v) => v.lang.toLowerCase().startsWith("en"));
    if (englishFallback) {
      return { voice: englishFallback, name: englishFallback.name, isNatural: false };
    }
  }

  // Final fallback: System default
  const defaultVoice = voices.find((v) => v.default) || voices[0] || null;
  return { voice: defaultVoice, name: defaultVoice?.name || "System Default", isNatural: false };
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
 * Safely stops any ongoing speech playback immediately without throwing errors.
 */
export function stopSpeaking() {
  currentSessionId++;
  isSpeechActive = false;
  clearKeepAlive();

  if (pendingSpeakTimer) {
    clearTimeout(pendingSpeakTimer);
    pendingSpeakTimer = null;
  }
  if (watchdogTimer) {
    clearTimeout(watchdogTimer);
    watchdogTimer = null;
  }

  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    notifySpeakingState(false);
    return;
  }

  try {
    window.speechSynthesis.cancel();
  } catch {
    // Ignore cancel errors
  }

  if (activeUtterance) {
    activeUtterance.onstart = null;
    activeUtterance.onend = null;
    activeUtterance.onerror = null;
    activeUtterance = null;
  }
  if (window.__activeWeatherUtterance) {
    window.__activeWeatherUtterance.onstart = null;
    window.__activeWeatherUtterance.onend = null;
    window.__activeWeatherUtterance.onerror = null;
    window.__activeWeatherUtterance = null;
  }

  notifySpeakingState(false);
}

/**
 * Check if speech synthesis is currently active or starting.
 */
export function isSpeaking(): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  return isSpeechActive || window.speechSynthesis.speaking;
}

export interface BriefingScriptOptions {
  cityName: string;
  temperature: number;
  feelsLike?: number;
  weatherCode?: number;
  humidity: number;
  rainProbability: number;
  pm25?: number;
}

function getHindiWeatherCondition(code?: number): string {
  if (code === undefined) return "सुहावना मौसम";
  switch (code) {
    case 0:
      return "साफ़ आसमान";
    case 1:
      return "मुख्य रूप से साफ़ मौसम";
    case 2:
      return "आंशिक रूप से बादल छाए हुए";
    case 3:
      return "घने बादल";
    case 45:
    case 48:
      return "कोहरा और धुंध";
    case 51:
    case 53:
    case 55:
      return "हल्की बूंदाबांदी";
    case 61:
    case 63:
      return "बारिश की बौछारें";
    case 65:
      return "भारी बारिश";
    case 71:
    case 73:
    case 75:
      return "बर्फबारी";
    case 80:
    case 81:
    case 82:
      return "तेज़ मूसलाधार बारिश";
    case 95:
    case 96:
    case 99:
      return "गरज के साथ तेज़ तूफ़ान";
    default:
      return "बादल छाए रहने की संभावना";
  }
}

/**
 * Generates natural, human-sounding Indian Hindi weather briefing text.
 */
export function buildNaturalHindiBriefingScript(opts: BriefingScriptOptions): string {
  const roundedTemp = Math.round(opts.temperature);
  const condition = getHindiWeatherCondition(opts.weatherCode);

  let rainSentence = "आज बारिश की कोई संभावना नहीं है, मौसम पूरी तरह अनुकूल रहेगा।";
  if (opts.rainProbability >= 60) {
    rainSentence = `आज बारिश की संभावना ${opts.rainProbability} प्रतिशत तक है, बाहर निकलते समय छाता ज़रूर साथ रखें।`;
  } else if (opts.rainProbability >= 25) {
    rainSentence = `आज हल्की बूंदाबांदी या फुहारें पड़ने की संभावना ${opts.rainProbability} प्रतिशत है।`;
  }

  let aqiSentence = "हवा की गुणवत्ता साफ़ और स्वास्थ्यवर्धक है।";
  if (opts.pm25 !== undefined) {
    if (opts.pm25 > 120) {
      aqiSentence = "वायु गुणवत्ता काफ़ी ख़राब स्तर पर है, बाहर जाते समय N95 मास्क अवश्य पहनें।";
    } else if (opts.pm25 > 60) {
      aqiSentence = "वायु गुणवत्ता मध्यम है, संवेदनशील लोगों को सावधानी बरतने की सलाह दी जाती है।";
    }
  }

  return `नमस्ते! ${opts.cityName} के मौसम का ताज़ा हाल। इस समय तापमान ${roundedTemp} डिग्री सेल्सियस है, और ${condition} है। हवा में नमी ${opts.humidity} प्रतिशत दर्ज की गई है। ${rainSentence} ${aqiSentence} आपका दिन बहुत ही सुखद और मंगलमय रहे!`;
}

/**
 * Generates natural, human-sounding Indian English weather briefing text.
 */
export function buildNaturalEnglishBriefingScript(opts: BriefingScriptOptions): string {
  const roundedTemp = Math.round(opts.temperature);
  const condition = opts.weatherCode !== undefined ? getWeatherConditionInfo(opts.weatherCode).label : "fair weather";

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
  speechLang?: SpeechLanguage;
  onStart?: () => void;
  onEnd?: () => void;
}

/**
 * Bulletproof speech execution with immediate responsiveness, session tracking,
 * zero audio repetition, and automatic fallback for stuck online voices.
 * Supports both Indian Natural English (en-IN) and Indian Natural Hindi (hi-IN).
 */
export function speakWeatherBriefing(options: SpeakWeatherOptions, _isRetry = false): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    console.warn("Speech synthesis is not supported on this browser.");
    isSpeechActive = false;
    notifySpeakingState(false);
    options.onEnd?.();
    return;
  }

  // 1. Immediately cancel any prior speech or timers
  stopSpeaking();

  // 2. Start a fresh, unique session and notify UI immediately (0ms visual latency)
  const sessionId = ++currentSessionId;
  isSpeechActive = true;
  notifySpeakingState(true);
  options.onStart?.();

  // 3. Ensure synthesizer is active
  try {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  } catch {
    // Ignore
  }

  const lang = options.speechLang || "en";
  const text = lang === "hi" ? buildNaturalHindiBriefingScript(options) : buildNaturalEnglishBriefingScript(options);

  const executeSpeak = (chosenVoice?: SpeechSynthesisVoice | null) => {
    if (sessionId !== currentSessionId) return;

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === "hi" ? "hi-IN" : "en-IN";
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      const voiceToUse = chosenVoice !== undefined ? chosenVoice : getBestIndianVoice(lang).voice;
      if (voiceToUse) {
        utterance.voice = voiceToUse;
      }

      // Maintain persistent reference to prevent V8 GC mid-speech
      activeUtterance = utterance;
      window.__activeWeatherUtterance = utterance;

      let speechStarted = false;

      utterance.onstart = () => {
        if (sessionId !== currentSessionId) return;
        speechStarted = true;
        if (watchdogTimer) {
          clearTimeout(watchdogTimer);
          watchdogTimer = null;
        }
        startKeepAlive();
        notifySpeakingState(true);
      };

      utterance.onend = () => {
        if (sessionId !== currentSessionId) return;
        clearKeepAlive();
        if (watchdogTimer) {
          clearTimeout(watchdogTimer);
          watchdogTimer = null;
        }
        activeUtterance = null;
        window.__activeWeatherUtterance = null;
        isSpeechActive = false;
        notifySpeakingState(false);
        options.onEnd?.();
      };

      utterance.onerror = (event) => {
        if (sessionId !== currentSessionId) return;
        clearKeepAlive();
        if (watchdogTimer) {
          clearTimeout(watchdogTimer);
          watchdogTimer = null;
        }
        activeUtterance = null;
        window.__activeWeatherUtterance = null;

        // Canceled or interrupted by user stop/toggle
        if (event.error === "canceled" || event.error === "interrupted") {
          isSpeechActive = false;
          notifySpeakingState(false);
          options.onEnd?.();
          return;
        }

        console.warn("Speech synthesis notice:", event.error);
        isSpeechActive = false;
        notifySpeakingState(false);
        options.onEnd?.();
      };

      // Watchdog: If an online network voice stalls without starting in 1200ms, fallback to local voice
      if (voiceToUse && !voiceToUse.localService) {
        watchdogTimer = setTimeout(() => {
          if (sessionId !== currentSessionId) return;
          if (!speechStarted) {
            console.warn("Online voice latency detected; seamlessly switching to local speech for fast responsiveness.");
            try {
              window.speechSynthesis.cancel();
            } catch {
              // Ignore
            }
            // Execute fallback with system default
            executeSpeak(null);
          }
        }, 1200);
      }

      window.speechSynthesis.speak(utterance);

      // Chromium queue unfreezing
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    } catch (err) {
      console.warn("Speech synthesis safe fallback:", err);
      clearKeepAlive();
      if (watchdogTimer) {
        clearTimeout(watchdogTimer);
        watchdogTimer = null;
      }
      activeUtterance = null;
      window.__activeWeatherUtterance = null;
      isSpeechActive = false;
      notifySpeakingState(false);
      options.onEnd?.();
    }
  };

  // Minimal settling delay to allow any pending cancel() to clear cleanly in Chromium
  pendingSpeakTimer = setTimeout(() => {
    pendingSpeakTimer = null;
    executeSpeak();
  }, 15);
}
