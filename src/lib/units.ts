/**
 * Unit system type
 */
export type UnitSystem = 'metric' | 'imperial';

/**
 * Conversion utilities for metric <-> imperial
 * All database values are stored in metric units
 */

// === Depth conversions (meters <-> feet) ===
export function mToFt(meters: number): number {
  return meters * 3.28084;
}

export function ftToM(feet: number): number {
  return feet / 3.28084;
}

// === Temperature conversions (°C <-> °F) ===
export function cToF(celsius: number): number {
  return (celsius * 9) / 5 + 32;
}

export function fToC(fahrenheit: number): number {
  return ((fahrenheit - 32) * 5) / 9;
}

// === Distance conversions (meters <-> feet, same as depth) ===
// Visibility and other distances use the same conversion as depth
export const metersToFeet = mToFt;
export const feetToMeters = ftToM;

// === Formatting helpers ===
export function formatValue(value: number, decimals: number = 1): string {
  if (isNaN(value) || !isFinite(value)) return '';
  return value.toFixed(decimals);
}

export function formatInteger(value: number): string {
  if (isNaN(value) || !isFinite(value)) return '';
  return Math.round(value).toString();
}

// === Display helpers ===

/**
 * Format depth for display
 * @param valueMeters - Depth in meters (from database)
 * @param unitSystem - Target unit system
 * @returns Object with formatted value and unit label
 */
export function displayDepth(
  valueMeters: number | null | undefined,
  unitSystem: UnitSystem
): { value: string; unit: 'm' | 'ft' } {
  if (valueMeters == null || isNaN(valueMeters)) {
    return { value: '', unit: unitSystem === 'metric' ? 'm' : 'ft' };
  }

  if (unitSystem === 'imperial') {
    const feet = mToFt(valueMeters);
    return { value: formatInteger(feet), unit: 'ft' };
  }

  return { value: formatInteger(valueMeters), unit: 'm' };
}

/**
 * Format temperature for display
 * @param valueCelsius - Temperature in Celsius (from database)
 * @param unitSystem - Target unit system
 * @returns Object with formatted value and unit label
 */
export function displayTemperature(
  valueCelsius: number | null | undefined,
  unitSystem: UnitSystem
): { value: string; unit: '°C' | '°F' } {
  if (valueCelsius == null || isNaN(valueCelsius)) {
    return { value: '', unit: unitSystem === 'metric' ? '°C' : '°F' };
  }

  if (unitSystem === 'imperial') {
    const fahrenheit = cToF(valueCelsius);
    return { value: formatInteger(fahrenheit), unit: '°F' };
  }

  return { value: formatInteger(valueCelsius), unit: '°C' };
}

/**
 * Format distance/visibility for display
 * @param valueMeters - Distance in meters (from database)
 * @param unitSystem - Target unit system
 * @returns Object with formatted value and unit label
 */
export function displayDistance(
  valueMeters: number | null | undefined,
  unitSystem: UnitSystem
): { value: string; unit: 'm' | 'ft' } {
  // Same as depth
  return displayDepth(valueMeters, unitSystem);
}

/**
 * Convert UI input value to metric for database storage
 * @param uiValue - Value entered by user in UI units
 * @param unitSystem - Unit system the user entered the value in
 * @param type - Type of measurement (depth, temperature, distance)
 * @returns Value in metric units for database
 */
export function uiToMetric(
  uiValue: number | string | null | undefined,
  unitSystem: UnitSystem,
  type: 'depth' | 'temperature' | 'distance'
): number | null {
  if (uiValue == null || uiValue === '') return null;
  
  const numValue = typeof uiValue === 'string' ? parseFloat(uiValue) : uiValue;
  if (isNaN(numValue)) return null;

  if (unitSystem === 'metric') {
    return numValue;
  }

  // Convert from imperial to metric
  switch (type) {
    case 'depth':
    case 'distance':
      return ftToM(numValue);
    case 'temperature':
      return fToC(numValue);
    default:
      return numValue;
  }
}

/**
 * Convert metric database value to UI display value
 * @param metricValue - Value from database in metric units
 * @param unitSystem - Target unit system for display
 * @param type - Type of measurement (depth, temperature, distance)
 * @returns Value in UI units for display/editing
 */
export function metricToUI(
  metricValue: number | null | undefined,
  unitSystem: UnitSystem,
  type: 'depth' | 'temperature' | 'distance'
): number | null {
  if (metricValue == null || isNaN(metricValue)) return null;

  if (unitSystem === 'metric') {
    return metricValue;
  }

  // Convert from metric to imperial
  switch (type) {
    case 'depth':
    case 'distance':
      return mToFt(metricValue);
    case 'temperature':
      return cToF(metricValue);
    default:
      return metricValue;
  }
}

/**
 * Get unit label for a measurement type
 */
export function getUnitLabel(
  type: 'depth' | 'temperature' | 'distance',
  unitSystem: UnitSystem
): string {
  switch (type) {
    case 'depth':
    case 'distance':
      return unitSystem === 'metric' ? 'm' : 'ft';
    case 'temperature':
      return unitSystem === 'metric' ? '°C' : '°F';
    default:
      return '';
  }
}

// === Parsing utilities for AI response strings ===

/**
 * Parse a temperature string (e.g., "24-26°C" or "78-82°F") and return canonical Celsius values
 * Returns null if parsing fails
 */
export function parseTemperatureString(
  tempString: string
): { min: number; max: number } | null {
  if (!tempString || typeof tempString !== 'string') return null;

  // Remove whitespace
  const cleaned = tempString.trim();

  // Check if it's Fahrenheit (contains °F or F)
  const isFahrenheit = /°?F\b/i.test(cleaned);
  // Check if it's Celsius (contains °C or C, but not if it's part of a word)
  const isCelsius = /°?C\b/i.test(cleaned) && !isFahrenheit;

  // Extract numbers (supports ranges like "24-26" or single values like "25")
  const numberMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*[-–—]\s*(\d+(?:\.\d+)?)/);
  if (numberMatch) {
    const min = parseFloat(numberMatch[1]);
    const max = parseFloat(numberMatch[2]);
    if (!isNaN(min) && !isNaN(max)) {
      // Convert to Celsius if needed
      if (isFahrenheit) {
        return { min: fToC(min), max: fToC(max) };
      }
      // Assume Celsius if no unit or explicit Celsius
      return { min, max };
    }
  }

  // Try single number
  const singleMatch = cleaned.match(/(\d+(?:\.\d+)?)/);
  if (singleMatch) {
    const value = parseFloat(singleMatch[1]);
    if (!isNaN(value)) {
      if (isFahrenheit) {
        const celsius = fToC(value);
        return { min: celsius, max: celsius };
      }
      return { min: value, max: value };
    }
  }

  return null;
}

/**
 * Parse a distance/depth string (e.g., "15-25m" or "50-100ft") and return canonical meters
 * Returns null if parsing fails
 */
export function parseDistanceString(
  distanceString: string
): { min: number; max: number } | null {
  if (!distanceString || typeof distanceString !== 'string') return null;

  // Remove whitespace
  const cleaned = distanceString.trim();

  // Check if it's feet (contains ft or feet)
  const isFeet = /\b(ft|feet)\b/i.test(cleaned);
  // Check if it's meters (contains m, but not if it's part of "ft" or other words)
  const isMeters = /\bm\b/i.test(cleaned) && !isFeet;

  // Extract numbers (supports ranges like "15-25" or single values like "20")
  const numberMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*[-–—]\s*(\d+(?:\.\d+)?)/);
  if (numberMatch) {
    const min = parseFloat(numberMatch[1]);
    const max = parseFloat(numberMatch[2]);
    if (!isNaN(min) && !isNaN(max)) {
      // Convert to meters if needed
      if (isFeet) {
        return { min: ftToM(min), max: ftToM(max) };
      }
      // Assume meters if no unit or explicit meters
      return { min, max };
    }
  }

  // Try single number
  const singleMatch = cleaned.match(/(\d+(?:\.\d+)?)/);
  if (singleMatch) {
    const value = parseFloat(singleMatch[1]);
    if (!isNaN(value)) {
      if (isFeet) {
        const meters = ftToM(value);
        return { min: meters, max: meters };
      }
      return { min: value, max: value };
    }
  }

  return null;
}

/**
 * Format a temperature range for display
 * @param range - Temperature range in Celsius (canonical)
 * @param unitSystem - Target unit system
 * @returns Formatted string like "24-26°C" or "78-82°F"
 */
export function formatTemperatureRange(
  range: { min: number; max: number } | null,
  unitSystem: UnitSystem
): string {
  if (!range) return 'Data unavailable';

  if (unitSystem === 'imperial') {
    const minF = Math.round(cToF(range.min));
    const maxF = Math.round(cToF(range.max));
    if (minF === maxF) {
      return `${minF}°F`;
    }
    return `${minF}-${maxF}°F`;
  }

  // Metric
  const minC = Math.round(range.min);
  const maxC = Math.round(range.max);
  if (minC === maxC) {
    return `${minC}°C`;
  }
  return `${minC}-${maxC}°C`;
}

/**
 * Format a distance/visibility range for display
 * @param range - Distance range in meters (canonical)
 * @param unitSystem - Target unit system
 * @returns Formatted string like "15-25m" or "50-100ft"
 */
export function formatDistanceRange(
  range: { min: number; max: number } | null,
  unitSystem: UnitSystem
): string {
  if (!range) return 'Data unavailable';

  if (unitSystem === 'imperial') {
    const minFt = Math.round(mToFt(range.min));
    const maxFt = Math.round(mToFt(range.max));
    if (minFt === maxFt) {
      return `${minFt}ft`;
    }
    return `${minFt}-${maxFt}ft`;
  }

  // Metric
  const minM = Math.round(range.min);
  const maxM = Math.round(range.max);
  if (minM === maxM) {
    return `${minM}m`;
  }
  return `${minM}-${maxM}m`;
}

