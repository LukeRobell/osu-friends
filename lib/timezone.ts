// Country code → IANA timezone. Used to schedule "Tonight" matches in a timezone
// that makes sense for the majority of participants.
// US defaults to EST (America/New_York) per project decision.
const COUNTRY_TZ: Record<string, string> = {
  US: 'America/New_York',
  CA: 'America/Toronto',
  MX: 'America/Mexico_City',
  BR: 'America/Sao_Paulo',
  AR: 'America/Argentina/Buenos_Aires',
  GB: 'Europe/London',
  IE: 'Europe/Dublin',
  FR: 'Europe/Paris',
  DE: 'Europe/Berlin',
  NL: 'Europe/Amsterdam',
  BE: 'Europe/Brussels',
  CH: 'Europe/Zurich',
  AT: 'Europe/Vienna',
  ES: 'Europe/Madrid',
  PT: 'Europe/Lisbon',
  IT: 'Europe/Rome',
  PL: 'Europe/Warsaw',
  SE: 'Europe/Stockholm',
  NO: 'Europe/Oslo',
  DK: 'Europe/Copenhagen',
  FI: 'Europe/Helsinki',
  RU: 'Europe/Moscow',
  TR: 'Europe/Istanbul',
  UA: 'Europe/Kyiv',
  JP: 'Asia/Tokyo',
  KR: 'Asia/Seoul',
  CN: 'Asia/Shanghai',
  TW: 'Asia/Taipei',
  HK: 'Asia/Hong_Kong',
  SG: 'Asia/Singapore',
  ID: 'Asia/Jakarta',
  PH: 'Asia/Manila',
  TH: 'Asia/Bangkok',
  VN: 'Asia/Ho_Chi_Minh',
  MY: 'Asia/Kuala_Lumpur',
  IN: 'Asia/Kolkata',
  AU: 'Australia/Sydney',
  NZ: 'Pacific/Auckland',
};

const DEFAULT_TZ = 'America/New_York';

export function countryToTimezone(countryCode: string): string {
  return COUNTRY_TZ[countryCode.toUpperCase()] ?? DEFAULT_TZ;
}

// Returns 8pm tonight in the given IANA timezone as a UTC Date.
export function tonightAt8pm(tz: string): Date {
  const now = new Date();
  // Format today's date in that timezone
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const y = parts.find(p => p.type === 'year')!.value;
  const m = parts.find(p => p.type === 'month')!.value;
  const d = parts.find(p => p.type === 'day')!.value;

  const localString = `${y}-${m}-${d}T20:00:00`;
  const approx = new Date(`${localString}Z`);
  const offset = getTimezoneOffsetMs(tz, approx);
  return new Date(approx.getTime() - offset);
}

function getTimezoneOffsetMs(tz: string, date: Date): number {
  const utcStr = date.toLocaleString('en-US', { timeZone: 'UTC' });
  const tzStr  = date.toLocaleString('en-US', { timeZone: tz });
  return Date.parse(utcStr) - Date.parse(tzStr);
}

export function timezoneLabel(tz: string): string {
  const abbr = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    timeZoneName: 'short',
  }).formatToParts(new Date()).find(p => p.type === 'timeZoneName')?.value ?? tz;
  return abbr;
}
