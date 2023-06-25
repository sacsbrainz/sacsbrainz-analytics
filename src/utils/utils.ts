import { ReaderModel } from "@maxmind/geoip2-node";

const extractCountry = async (ip: string, geo: ReaderModel) => {
  if (geo.country(ip).country) {
    return geo.country(ip).country
      ? geo.country(ip).country?.names.en
      : "Unknown";
  }
  if (geo.country(ip).representedCountry) {
    geo.country(ip).representedCountry
      ? geo.country(ip).representedCountry?.names.en
      : "Unknown";
  }
  return "Unknown";
};

const extractCountryIsoCode = async (ip: string, geo: ReaderModel) => {
  if (geo.country(ip).country) {
    return geo.country(ip).country
      ? geo.country(ip).country?.isoCode
      : "Unknown";
  }
  if (geo.country(ip).representedCountry) {
    geo.country(ip).representedCountry
      ? geo.country(ip).representedCountry?.isoCode
      : "Unknown";
  }
  return "Unknown";
};

export { extractCountry, extractCountryIsoCode };
