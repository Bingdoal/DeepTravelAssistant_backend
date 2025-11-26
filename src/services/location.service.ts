import axios from "axios";

export interface LocationInfo {
  country: string;
  region: string; // 例如 state / province / autonomous community
  city?: string;
}

export const reverseGeocode = async (
  lat: number,
  lng: number
): Promise<LocationInfo> => {
  const apiKey = process.env.OPENCAGE_API_KEY;

  if (!apiKey) {
    // 沒設定 key 就先回 mock，方便本地開發
    return {
      country: "UnknownCountry",
      region: "UnknownRegion",
    };
  }

  const url = "https://api.opencagedata.com/geocode/v1/json";

  const resp = await axios.get(url, {
    params: {
      key: apiKey,
      q: `${lat},${lng}`,
      language: "en",
      pretty: 0,
    },
  });

  const data = resp.data;

  if (!data.results || data.results.length === 0) {
    return {
      country: "UnknownCountry",
      region: "UnknownRegion",
    };
  }

  const components = data.results[0].components;

  const country = components.country || "UnknownCountry";
  const region =
    components.state || components.region || components.county || "UnknownRegion";
  const city =
    components.city ||
    components.town ||
    components.village ||
    components.municipality;

  return { country, region, city };
};