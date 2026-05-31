export function formatCountryCurrencyCode(
  countryCode: string,
  currencyCode: string
) {
  return `${countryCode.trim().toUpperCase()} ${currencyCode.trim().toUpperCase()}`;
}
