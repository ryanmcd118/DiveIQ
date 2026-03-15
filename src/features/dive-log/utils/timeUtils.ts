/**
 * Time conversion/normalization utilities and dive type constants
 * for the logbook form.
 */

export type LastEditedTime = "start" | "end" | "bottom" | null;

// Most common (visible when collapsed)
export const MOST_COMMON_DIVE_TYPES: string[] = [
  "Saltwater",
  "Freshwater",
  "Shore",
  "Boat",
  "Training",
];

// Expanded list (shown after "Show more")
export const EXPANDED_DIVE_TYPES: string[] = [
  "Drift",
  "Night",
  "Wreck",
  "Reef",
  "Quarry",
  "Lake",
  "River",
  "Cave",
  "Ice",
  "Altitude",
  "Wall",
  "Pool",
  "Other",
];

export function parseDiveTypeTags(tags: string | null | undefined): string[] {
  if (!tags) return [];
  try {
    const parsed = JSON.parse(tags);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Normalize flexible time input to HH:MM (12-hour display).
 * Accepts: 9, 09, 9:00, 9:5, 9:52, etc. Hour 0-12, minute 0-59.
 */
export function normalizeTime(value: string): string {
  if (!value || !value.trim()) return "";
  const trimmed = value.trim();
  const parts = trimmed.split(":");
  const first = parts[0]?.replace(/\s/g, "") ?? "";
  let hour = parseInt(first, 10);
  let minute =
    parts[1] != null ? parseInt(String(parts[1]).replace(/\s/g, ""), 10) : 0;
  if (Number.isNaN(hour)) return "";
  if (Number.isNaN(minute)) minute = 0;
  hour = Math.max(0, Math.min(hour, 12));
  minute = Math.max(0, Math.min(minute, 59));
  const h = hour.toString().padStart(2, "0");
  const m = minute.toString().padStart(2, "0");
  return `${h}:${m}`;
}

export function splitTimeForDisplay(time: string | null | undefined): {
  value: string;
  period: "AM" | "PM";
} {
  if (!time) return { value: "", period: "AM" };
  const match = time.match(/^(\d{2}):(\d{2})$/);
  if (!match) return { value: "", period: "AM" };

  let hours24 = Number(match[1]);
  const minutes = match[2];
  const period: "AM" | "PM" = hours24 >= 12 ? "PM" : "AM";

  if (hours24 === 0) {
    hours24 = 12;
  } else if (hours24 > 12) {
    hours24 -= 12;
  }

  const displayHours = hours24.toString().padStart(2, "0");
  return { value: `${displayHours}:${minutes}`, period };
}

export function to24HourTime(value: string, period: "AM" | "PM"): string {
  const normalized = normalizeTime(value);
  if (!normalized) return "";
  const match = normalized.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return "";

  let hours = Number(match[1]);
  const minutes = match[2];
  if (hours === 0) hours = 12; // 00:xx display = 12 AM
  if (period === "AM") {
    if (hours === 12) hours = 0;
  } else {
    if (hours !== 12) hours += 12;
  }

  const hStr = hours.toString().padStart(2, "0");
  return `${hStr}:${minutes}`;
}

export function timeToMinutes(
  value: string,
  period: "AM" | "PM"
): number | null {
  const normalized = normalizeTime(value);
  if (!normalized) return null;
  const time24 = to24HourTime(normalized, period);
  if (!time24) return null;
  const match = time24.match(/^(\d{2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

export function minutesToDisplayTime(totalMinutes: number): {
  value: string;
  period: "AM" | "PM";
} {
  const minutes = Math.max(0, Math.floor(totalMinutes));
  const hours24 = Math.floor(minutes / 60) % 24;
  const mins = minutes % 60;
  const period: "AM" | "PM" = hours24 >= 12 ? "PM" : "AM";

  let hours12 = hours24 % 12;
  if (hours12 === 0) hours12 = 12;
  const displayHours = hours12.toString().padStart(2, "0");
  const displayMinutes = mins.toString().padStart(2, "0");
  return { value: `${displayHours}:${displayMinutes}`, period };
}

/** Duration in minutes; if end < start, assumes end is next day (+24h). */
export function durationMinutes(startMin: number, endMin: number): number {
  if (endMin >= startMin) return endMin - startMin;
  return endMin + 24 * 60 - startMin;
}
