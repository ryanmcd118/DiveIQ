// Utility to safely parse JSON arrays stored as strings in the database

export function parseJsonArray<T = string>(
  value: string | null | undefined
): T[] {
  if (!value || value.trim() === "") return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed as T[];
    }
    return [];
  } catch {
    return [];
  }
}

export function stringifyJsonArray(
  value: (string | number)[] | null | undefined
): string | null {
  if (!value || value.length === 0) return null;
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}
