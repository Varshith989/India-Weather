import type { GeoLocation } from "../types/weather";

export async function searchIndianLocations(query: string): Promise<GeoLocation[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  // Check if query is 6-digit Indian PIN Code
  if (/^\d{6}$/.test(trimmed)) {
    const pinLocation = await resolvePostalPin(trimmed);
    if (pinLocation) return [pinLocation];
  }

  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(trimmed)}&count=6&language=en&format=json&countryCode=IN`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();

  if (!data.results || !Array.isArray(data.results)) return [];

  return data.results.map((item: any) => ({
    name: item.name,
    state: item.admin1 || "India",
    country: "India",
    latitude: item.latitude,
    longitude: item.longitude,
  }));
}

async function resolvePostalPin(pin: string): Promise<GeoLocation | null> {
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
    const data = await res.json();

    if (data && data[0] && data[0].Status === "Success" && data[0].PostOffice?.length > 0) {
      const po = data[0].PostOffice[0];
      const placeName = po.District || po.Name;

      // Geocode the district or place
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(placeName)}&count=1&language=en&format=json&countryCode=IN`;
      const geoRes = await fetch(geoUrl);
      const geoData = await geoRes.json();

      if (geoData.results && geoData.results.length > 0) {
        const item = geoData.results[0];
        return {
          name: `${po.Name} (${pin})`,
          state: `${po.District}, ${po.State}`,
          country: "India",
          latitude: item.latitude,
          longitude: item.longitude,
        };
      }
    }
  } catch (err) {
    console.warn("Postal PIN resolution failed:", err);
  }
  return null;
}

export async function reverseGeocodeCoords(lat: number, lon: number): Promise<GeoLocation> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`;
    const res = await fetch(url, { headers: { "Accept-Language": "en" } });
    if (res.ok) {
      const data = await res.json();
      if (data && data.address) {
        const name = data.address.city || data.address.town || data.address.district || "Current Location";
        const state = data.address.state || "India";
        return {
          name,
          state,
          country: "India",
          latitude: lat,
          longitude: lon,
        };
      }
    }
  } catch (e) {
    console.warn("Reverse geocode failed:", e);
  }

  return {
    name: "My Location",
    state: "India",
    country: "India",
    latitude: lat,
    longitude: lon,
  };
}
