export interface TimezoneCity {
  ianaTimezone: string;
  label: string;
  region: string;
}

export const TIMEZONE_CITIES: TimezoneCity[] = [
  { ianaTimezone: "Asia/Taipei", label: "台北", region: "亞洲" },
  { ianaTimezone: "Asia/Tokyo", label: "東京", region: "亞洲" },
  { ianaTimezone: "Asia/Seoul", label: "首爾", region: "亞洲" },
  { ianaTimezone: "Asia/Shanghai", label: "上海", region: "亞洲" },
  { ianaTimezone: "Asia/Hong_Kong", label: "香港", region: "亞洲" },
  { ianaTimezone: "Asia/Singapore", label: "新加坡", region: "亞洲" },
  { ianaTimezone: "Asia/Bangkok", label: "曼谷", region: "亞洲" },
  { ianaTimezone: "Asia/Kolkata", label: "孟買", region: "亞洲" },
  { ianaTimezone: "Asia/Dubai", label: "杜拜", region: "中東" },
  { ianaTimezone: "Europe/London", label: "倫敦", region: "歐洲" },
  { ianaTimezone: "Europe/Paris", label: "巴黎", region: "歐洲" },
  { ianaTimezone: "Europe/Berlin", label: "柏林", region: "歐洲" },
  { ianaTimezone: "Europe/Madrid", label: "馬德里", region: "歐洲" },
  { ianaTimezone: "Europe/Amsterdam", label: "阿姆斯特丹", region: "歐洲" },
  { ianaTimezone: "America/New_York", label: "紐約", region: "北美洲" },
  { ianaTimezone: "America/Chicago", label: "芝加哥", region: "北美洲" },
  { ianaTimezone: "America/Chicago", label: "密爾瓦基", region: "北美洲" },
  { ianaTimezone: "America/Denver", label: "丹佛", region: "北美洲" },
  { ianaTimezone: "America/Los_Angeles", label: "洛杉磯", region: "北美洲" },
  { ianaTimezone: "America/Toronto", label: "多倫多", region: "北美洲" },
  { ianaTimezone: "America/Vancouver", label: "溫哥華", region: "北美洲" },
  { ianaTimezone: "America/Sao_Paulo", label: "聖保羅", region: "南美洲" },
  { ianaTimezone: "Australia/Sydney", label: "雪梨", region: "大洋洲" },
  { ianaTimezone: "Australia/Perth", label: "伯斯", region: "大洋洲" },
  { ianaTimezone: "Pacific/Auckland", label: "奧克蘭", region: "大洋洲" },
];

export function findCity(ianaTimezone: string): TimezoneCity | undefined {
  return TIMEZONE_CITIES.find((city) => city.ianaTimezone === ianaTimezone);
}

export function guessDeviceCity(): TimezoneCity {
  const deviceZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return findCity(deviceZone) ?? TIMEZONE_CITIES[0];
}
