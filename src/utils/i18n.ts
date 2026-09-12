export type Language = "en" | "hi" | "te" | "ta";

export interface Translations {
  appName: string;
  liveObservation: string;
  feelsLike: string;
  minMax: string;
  wetBulb: string;
  naqiTitle: string;
  cpcbStandard: string;
  prominentPollutant: string;
  humidity: string;
  wind: string;
  uvIndex: string;
  visibility: string;
  pressure: string;
  sunCycle: string;
  hourlyTitle: string;
  sevenDayTitle: string;
  copilotTitle: string;
  kisanTitle: string;
  listenBriefing: string;
  stopBriefing: string;
  shareWhatsApp: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    appName: "IndiaWeather",
    liveObservation: "LIVE METEOROLOGICAL STATION",
    feelsLike: "Feels like",
    minMax: "Min / Max",
    wetBulb: "Wet Bulb Index",
    naqiTitle: "National Air Quality (NAQI)",
    cpcbStandard: "CPCB Standard",
    prominentPollutant: "Prominent Pollutant",
    humidity: "Humidity",
    wind: "Wind",
    uvIndex: "UV Index",
    visibility: "Visibility",
    pressure: "Pressure",
    sunCycle: "Sun Cycle",
    hourlyTitle: "24-Hour Micro-Forecast",
    sevenDayTitle: "7-Day Extended Outlook",
    copilotTitle: "Smart Weather Copilot • Daily Living",
    kisanTitle: "🌾 Kisan & Agro-Weather Advisory",
    listenBriefing: "Listen to Voice Briefing",
    stopBriefing: "Stop Voice",
    shareWhatsApp: "Share on WhatsApp",
  },
  hi: {
    appName: "इण्डिया वेदर",
    liveObservation: "लाइव मौसम केंद्र",
    feelsLike: "अनुभव तापमान",
    minMax: "न्यूनतम / अधिकतम",
    wetBulb: "वेट बल्ब सूचकांक",
    naqiTitle: "राष्ट्रीय वायु गुणवत्ता (NAQI)",
    cpcbStandard: "CPCB मानक",
    prominentPollutant: "प्रमुख प्रदूषक",
    humidity: "आर्द्रता (नमी)",
    wind: "हवा की गति",
    uvIndex: "यूवी सूचकांक",
    visibility: "दृश्यता",
    pressure: "वायुमंडलीय दबाव",
    sunCycle: "सूर्योदय व सूर्यास्त",
    hourlyTitle: "24 घंटे का सटीक पूर्वानुमान",
    sevenDayTitle: "7 दिनों का मौसम पूर्वानुमान",
    copilotTitle: "स्मार्ट मौसम सहायक • दैनिक सलाह",
    kisanTitle: "🌾 किसान एवं कृषि मौसम परामर्श",
    listenBriefing: "मौसम समाचार सुनें",
    stopBriefing: "आवाज़ बंद करें",
    shareWhatsApp: "व्हाट्सएप पर साझा करें",
  },
  te: {
    appName: "ఇండియా వెదర్",
    liveObservation: "ప్రత్యక్ష వాతావరణ పరిశీలన",
    feelsLike: "అనుభూతి చెందే ఉష్ణోగ్రత",
    minMax: "కనిష్ట / గరిష్ట",
    wetBulb: "వెట్‌బల్బ్ సూచిక",
    naqiTitle: "జాతీయ గాలి నాణ్యత (NAQI)",
    cpcbStandard: "CPCB ప్రమాణం",
    prominentPollutant: "ప్రధాన కాలుష్య కారకం",
    humidity: "తేమ శాతం",
    wind: "గాలి వేగం",
    uvIndex: "UV సూచిక",
    visibility: "దృశ్యమానత",
    pressure: "పీడనం",
    sunCycle: "సూర్యోదయ / సూర్యాస్తమయం",
    hourlyTitle: "24 గంటల వాతావరణ అంచనా",
    sevenDayTitle: "7 రోజుల ముందస్తు సూచన",
    copilotTitle: "స్మార్ట్ వాతావరణ సలహాదారు",
    kisanTitle: "🌾 రైతు వాతావరణ సలహాలు (కిసాన్)",
    listenBriefing: "వాయిస్ బులెటిన్ వినండి",
    stopBriefing: "వాయిస్ ఆపండి",
    shareWhatsApp: "వాట్సాప్‌లో పంపండి",
  },
  ta: {
    appName: "இந்தியா வெதர்",
    liveObservation: "நேரடி வானிலை மையம்",
    feelsLike: "உணரப்படும் வெப்பநிலை",
    minMax: "குறைந்த / அதிகபட்சம்",
    wetBulb: "ஈரக்குமிழ் குறியீடு",
    naqiTitle: "தேசிய காற்றுத் தரம் (NAQI)",
    cpcbStandard: "CPCB தரம்",
    prominentPollutant: "முக்கிய காற்று மாசுபடுத்தி",
    humidity: "காற்றின் ஈரப்பதம்",
    wind: "காற்றின் வேகம்",
    uvIndex: "UV குறியீடு",
    visibility: "பார்வைத் தூரம்",
    pressure: "காற்றழுத்தம்",
    sunCycle: "சூரிய உதயம் / மறைவு",
    hourlyTitle: "24 மணி நேர வானிலை தகவல்",
    sevenDayTitle: "7 நாள் நீட்டிக்கப்பட்ட முன்னறிவிப்பு",
    copilotTitle: "ஸ்மார்ட் வானிலை வழிகாட்டி",
    kisanTitle: "🌾 உழவர் வேளாண் வானிலை வழிகாட்டுதல்",
    listenBriefing: "வானிலை செய்தியைக் கேட்கவும்",
    stopBriefing: "குரலை நிறுத்து",
    shareWhatsApp: "வாட்ஸ்அப்பில் பகிரவும்",
  },
};
