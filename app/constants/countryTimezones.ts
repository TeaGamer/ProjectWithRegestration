import {
  getAllCountries,
  getTimezonesForCountry,
  type CountryCode,
} from "countries-and-timezones";

export const COUNTRY_OPTIONS = Object.values(getAllCountries())
  .sort((first, second) => first.name.localeCompare(second.name, "en"))
  .map(({ id, name }) => ({ id, name }));

const PREFERRED_TIMEZONES: Partial<Record<CountryCode, string>> = {
  AU: "Australia/Sydney",
  BR: "America/Sao Paulo",
  CA: "America/Toronto",
  RU: "Russia/Moscow",
  US: "America/New York",
  UA: "Ukraine/Kyiv",
  PL: "Europe/Warsaw",
};

export function getCountryTimezones(countryId: string): string[] {
  return getTimezonesForCountry(countryId)?.map(({ name }) => name) ?? [];
}

export function getCountryIdByName(countryName: string): string {
  return COUNTRY_OPTIONS.find(({ name }) => name === countryName)?.id ?? "PL";
}

export function getDefaultTimezoneForCountry(
  countryId: string,
  browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
): string {
  const timezones = getCountryTimezones(countryId);
  if (timezones.includes(browserTimezone)) return browserTimezone;

  const preferredTimezone = PREFERRED_TIMEZONES[countryId as CountryCode];
  if (preferredTimezone && timezones.includes(preferredTimezone)) return preferredTimezone;

  return timezones[0] ?? "UTC";
}

export function getTimezoneLabel(timezoneName: string): string {
  const offset = new Intl.DateTimeFormat("en", {
    timeZone: timezoneName,
    timeZoneName: "shortOffset",
  }).format(new Date());
  const offsetLabel = offset.split(" ").at(-1) ?? "UTC";
  return `${timezoneName} (${offsetLabel})`;
}
