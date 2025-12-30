/**
 * Per-measurement unit types
 */
export type DepthUnit = "ft" | "m";
export type TempUnit = "f" | "c";
export type PressureUnit = "psi" | "bar";
export type WeightUnit = "lb" | "kg";

/**
 * Unit preferences interface
 */
export interface UnitPreferences {
  depth: DepthUnit;
  temperature: TempUnit;
  pressure: PressureUnit;
  weight: WeightUnit;
}

/**
 * Default unit preferences (imperial-ish)
 */
export const DEFAULT_UNIT_PREFERENCES: UnitPreferences = {
  depth: "ft",
  temperature: "f",
  pressure: "psi",
  weight: "lb",
};

/**
 * Legacy UnitSystem type (kept for backward compatibility with guest toggles)
 */
export type UnitSystem = "metric" | "imperial";

/**
 * Convert UnitSystem to UnitPreferences (for guest toggles)
 */
export function unitSystemToPreferences(
  unitSystem: UnitSystem
): UnitPreferences {
  if (unitSystem === "metric") {
    return {
      depth: "m",
      temperature: "c",
      pressure: "bar",
      weight: "kg",
    };
  }
  return DEFAULT_UNIT_PREFERENCES;
}

/**
 * Convert UnitPreferences to UnitSystem (for guest toggles)
 */
export function preferencesToUnitSystem(prefs: UnitPreferences): UnitSystem {
  // If all are metric, return 'metric', otherwise 'imperial'
  if (
    prefs.depth === "m" &&
    prefs.temperature === "c" &&
    prefs.pressure === "bar" &&
    prefs.weight === "kg"
  ) {
    return "metric";
  }
  return "imperial";
}

// === Fixed-point conversion constants ===
const FEET_TO_CM = 30.48; // 1 ft = 30.48 cm
const METERS_TO_CM = 100; // 1 m = 100 cm
const CELSIUS_TO_CX10 = 10; // 1°C = 10 Cx10 units

// === Depth/Distance conversions (canonical: centimeters) ===

/**
 * Convert feet to centimeters (fixed-point canonical)
 */
export function feetToCm(feet: number): number {
  return Math.round(feet * FEET_TO_CM);
}

/**
 * Convert centimeters to feet
 */
export function cmToFeet(cm: number): number {
  return cm / FEET_TO_CM;
}

/**
 * Convert meters to centimeters (fixed-point canonical)
 */
export function metersToCm(meters: number): number {
  return Math.round(meters * METERS_TO_CM);
}

/**
 * Convert centimeters to meters
 */
export function cmToMeters(cm: number): number {
  return cm / METERS_TO_CM;
}

// === Temperature conversions (canonical: Cx10 - tenths of Celsius) ===

/**
 * Convert Fahrenheit to Cx10 (fixed-point canonical)
 */
export function fToCx10(fahrenheit: number): number {
  const celsius = ((fahrenheit - 32) * 5) / 9;
  return Math.round(celsius * CELSIUS_TO_CX10);
}

/**
 * Convert Cx10 to Fahrenheit
 */
export function cx10ToF(cx10: number): number {
  const celsius = cx10 / CELSIUS_TO_CX10;
  return (celsius * 9) / 5 + 32;
}

/**
 * Convert Celsius to Cx10 (fixed-point canonical)
 */
export function cToCx10(celsius: number): number {
  return Math.round(celsius * CELSIUS_TO_CX10);
}

/**
 * Convert Cx10 to Celsius
 */
export function cx10ToC(cx10: number): number {
  return cx10 / CELSIUS_TO_CX10;
}

// === Legacy conversion helpers (for backward compatibility) ===

export function mToFt(meters: number): number {
  return meters * 3.28084;
}

export function ftToM(feet: number): number {
  return feet / 3.28084;
}

export function cToF(celsius: number): number {
  return (celsius * 9) / 5 + 32;
}

export function fToC(fahrenheit: number): number {
  return ((fahrenheit - 32) * 5) / 9;
}

export const metersToFeet = mToFt;
export const feetToMeters = ftToM;

// === Formatting helpers ===

export function formatValue(value: number, decimals: number = 1): string {
  if (isNaN(value) || !isFinite(value)) return "";
  return value.toFixed(decimals);
}

export function formatInteger(value: number): string {
  if (isNaN(value) || !isFinite(value)) return "";
  return Math.round(value).toString();
}

// === Display helpers (fixed-point canonical -> display) ===

/**
 * Format depth for display from canonical centimeters
 * @param depthCm - Depth in centimeters (canonical fixed-point)
 * @param depthUnit - Target unit ('ft' or 'm')
 * @returns Object with formatted value and unit label
 */
export function displayDepth(
  depthCm: number | null | undefined,
  depthUnit: DepthUnit
): { value: string; unit: "m" | "ft" } {
  if (depthCm == null || isNaN(depthCm)) {
    return { value: "", unit: depthUnit === "m" ? "m" : "ft" };
  }

  if (depthUnit === "ft") {
    const feet = cmToFeet(depthCm);
    return { value: formatInteger(feet), unit: "ft" };
  }

  // Metric (meters)
  const meters = cmToMeters(depthCm);
  return { value: formatInteger(meters), unit: "m" };
}

/**
 * Format temperature for display from canonical Cx10
 * @param tempCx10 - Temperature in Cx10 (canonical fixed-point)
 * @param tempUnit - Target unit ('f' or 'c')
 * @returns Object with formatted value and unit label
 */
export function displayTemperature(
  tempCx10: number | null | undefined,
  tempUnit: TempUnit
): { value: string; unit: "°C" | "°F" } {
  if (tempCx10 == null || isNaN(tempCx10)) {
    return { value: "", unit: tempUnit === "c" ? "°C" : "°F" };
  }

  if (tempUnit === "f") {
    const fahrenheit = cx10ToF(tempCx10);
    return { value: formatInteger(fahrenheit), unit: "°F" };
  }

  // Celsius
  const celsius = cx10ToC(tempCx10);
  return { value: formatInteger(celsius), unit: "°C" };
}

/**
 * Format distance/visibility for display from canonical centimeters
 * @param distanceCm - Distance in centimeters (canonical fixed-point)
 * @param depthUnit - Target unit ('ft' or 'm') - uses depth unit preference
 * @returns Object with formatted value and unit label
 */
export function displayDistance(
  distanceCm: number | null | undefined,
  depthUnit: DepthUnit
): { value: string; unit: "m" | "ft" } {
  // Same as depth
  return displayDepth(distanceCm, depthUnit);
}

// === Input helpers (UI -> canonical fixed-point) ===

/**
 * Convert UI depth input to canonical centimeters
 * @param value - Value entered by user
 * @param unit - Unit the user entered ('ft' or 'm')
 * @returns Depth in centimeters (fixed-point canonical)
 */
export function depthInputToCm(
  value: number | string | null | undefined,
  unit: DepthUnit
): number | null {
  if (value == null || value === "") return null;

  const numValue = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(numValue)) return null;

  if (unit === "ft") {
    return feetToCm(numValue);
  }
  // Metric (meters)
  return metersToCm(numValue);
}

/**
 * Convert UI temperature input to canonical Cx10
 * @param value - Value entered by user
 * @param unit - Unit the user entered ('f' or 'c')
 * @returns Temperature in Cx10 (fixed-point canonical)
 */
export function tempInputToCx10(
  value: number | string | null | undefined,
  unit: TempUnit
): number | null {
  if (value == null || value === "") return null;

  const numValue = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(numValue)) return null;

  if (unit === "f") {
    return fToCx10(numValue);
  }
  // Celsius
  return cToCx10(numValue);
}

/**
 * Convert UI distance input to canonical centimeters
 * @param value - Value entered by user
 * @param unit - Unit the user entered ('ft' or 'm')
 * @returns Distance in centimeters (fixed-point canonical)
 */
export function distanceInputToCm(
  value: number | string | null | undefined,
  unit: DepthUnit
): number | null {
  // Same as depth
  return depthInputToCm(value, unit);
}

/**
 * Convert canonical centimeters to UI display value
 * @param depthCm - Depth in centimeters (canonical)
 * @param depthUnit - Target unit for display
 * @returns Value in UI units for display/editing
 */
export function cmToUI(
  depthCm: number | null | undefined,
  depthUnit: DepthUnit
): number | null {
  if (depthCm == null || isNaN(depthCm)) return null;

  if (depthUnit === "ft") {
    return cmToFeet(depthCm);
  }
  return cmToMeters(depthCm);
}

/**
 * Convert canonical Cx10 to UI display value
 * @param tempCx10 - Temperature in Cx10 (canonical)
 * @param tempUnit - Target unit for display
 * @returns Value in UI units for display/editing
 */
export function cx10ToUI(
  tempCx10: number | null | undefined,
  tempUnit: TempUnit
): number | null {
  if (tempCx10 == null || isNaN(tempCx10)) return null;

  if (tempUnit === "f") {
    return cx10ToF(tempCx10);
  }
  return cx10ToC(tempCx10);
}

/**
 * Get unit label for a measurement type
 */
export function getUnitLabel(
  type: "depth" | "temperature" | "distance",
  prefs: UnitPreferences
): string {
  switch (type) {
    case "depth":
    case "distance":
      return prefs.depth === "m" ? "m" : "ft";
    case "temperature":
      return prefs.temperature === "c" ? "°C" : "°F";
    default:
      return "";
  }
}

// === Legacy helpers (for backward compatibility with existing code) ===

/**
 * Legacy: Convert UI input value to metric for database storage
 * @deprecated Use depthInputToCm, tempInputToCx10, etc. instead
 */
export function uiToMetric(
  uiValue: number | string | null | undefined,
  unitSystem: UnitSystem,
  type: "depth" | "temperature" | "distance"
): number | null {
  if (uiValue == null || uiValue === "") return null;

  const numValue = typeof uiValue === "string" ? parseFloat(uiValue) : uiValue;
  if (isNaN(numValue)) return null;

  const prefs = unitSystemToPreferences(unitSystem);

  switch (type) {
    case "depth":
    case "distance":
      return depthInputToCm(numValue, prefs.depth)
        ? cmToMeters(depthInputToCm(numValue, prefs.depth)!)
        : null;
    case "temperature":
      return tempInputToCx10(numValue, prefs.temperature)
        ? cx10ToC(tempInputToCx10(numValue, prefs.temperature)!)
        : null;
    default:
      return numValue;
  }
}

/**
 * Legacy: Convert metric database value to UI display value
 * @deprecated Use cmToUI, cx10ToUI, etc. instead
 */
export function metricToUI(
  metricValue: number | null | undefined,
  unitSystem: UnitSystem,
  type: "depth" | "temperature" | "distance"
): number | null {
  if (metricValue == null || isNaN(metricValue)) return null;

  const prefs = unitSystemToPreferences(unitSystem);

  switch (type) {
    case "depth":
    case "distance":
      // Convert meters to cm, then to UI
      const depthCm = metersToCm(metricValue);
      return cmToUI(depthCm, prefs.depth);
    case "temperature":
      // Convert Celsius to Cx10, then to UI
      const tempCx10 = cToCx10(metricValue);
      return cx10ToUI(tempCx10, prefs.temperature);
    default:
      return metricValue;
  }
}

// === Parsing utilities for AI response strings ===

/**
 * Parse a temperature string (e.g., "24-26°C" or "78-82°F") and return canonical Cx10 range
 * Returns null if parsing fails
 */
export function parseTemperatureString(
  tempString: string
): { min: number; max: number } | null {
  if (!tempString || typeof tempString !== "string") return null;

  const cleaned = tempString.trim();

  const isFahrenheit = /°?F\b/i.test(cleaned);
  const isCelsius = /°?C\b/i.test(cleaned) && !isFahrenheit;

  // Extract numbers (supports ranges like "24-26" or single values like "25")
  const numberMatch = cleaned.match(
    /(\d+(?:\.\d+)?)\s*[-–—]\s*(\d+(?:\.\d+)?)/
  );
  if (numberMatch) {
    const min = parseFloat(numberMatch[1]);
    const max = parseFloat(numberMatch[2]);
    if (!isNaN(min) && !isNaN(max)) {
      if (isFahrenheit) {
        return { min: fToCx10(min), max: fToCx10(max) };
      }
      // Celsius
      return { min: cToCx10(min), max: cToCx10(max) };
    }
  }

  // Try single number
  const singleMatch = cleaned.match(/(\d+(?:\.\d+)?)/);
  if (singleMatch) {
    const value = parseFloat(singleMatch[1]);
    if (!isNaN(value)) {
      if (isFahrenheit) {
        const cx10 = fToCx10(value);
        return { min: cx10, max: cx10 };
      }
      const cx10 = cToCx10(value);
      return { min: cx10, max: cx10 };
    }
  }

  return null;
}

/**
 * Parse a distance/depth string (e.g., "15-25m" or "50-100ft") and return canonical centimeters
 * Returns null if parsing fails
 */
export function parseDistanceString(
  distanceString: string
): { min: number; max: number } | null {
  if (!distanceString || typeof distanceString !== "string") return null;

  const cleaned = distanceString.trim();

  const isFeet = /\b(ft|feet)\b/i.test(cleaned);
  const isMeters = /\bm\b/i.test(cleaned) && !isFeet;

  // Extract numbers (supports ranges like "15-25" or single values like "20")
  const numberMatch = cleaned.match(
    /(\d+(?:\.\d+)?)\s*[-–—]\s*(\d+(?:\.\d+)?)/
  );
  if (numberMatch) {
    const min = parseFloat(numberMatch[1]);
    const max = parseFloat(numberMatch[2]);
    if (!isNaN(min) && !isNaN(max)) {
      if (isFeet) {
        return { min: feetToCm(min), max: feetToCm(max) };
      }
      // Meters
      return { min: metersToCm(min), max: metersToCm(max) };
    }
  }

  // Try single number
  const singleMatch = cleaned.match(/(\d+(?:\.\d+)?)/);
  if (singleMatch) {
    const value = parseFloat(singleMatch[1]);
    if (!isNaN(value)) {
      if (isFeet) {
        const cm = feetToCm(value);
        return { min: cm, max: cm };
      }
      const cm = metersToCm(value);
      return { min: cm, max: cm };
    }
  }

  return null;
}

/**
 * Format a temperature range for display
 * @param range - Temperature range in Cx10 (canonical fixed-point)
 * @param tempUnit - Target unit ('f' or 'c')
 * @returns Formatted string like "24-26°C" or "78-82°F"
 */
export function formatTemperatureRange(
  range: { min: number; max: number } | null,
  tempUnit: TempUnit
): string {
  if (!range) return "Data unavailable";

  if (tempUnit === "f") {
    const minF = Math.round(cx10ToF(range.min));
    const maxF = Math.round(cx10ToF(range.max));
    if (minF === maxF) {
      return `${minF}°F`;
    }
    return `${minF}-${maxF}°F`;
  }

  // Celsius
  const minC = Math.round(cx10ToC(range.min));
  const maxC = Math.round(cx10ToC(range.max));
  if (minC === maxC) {
    return `${minC}°C`;
  }
  return `${minC}-${maxC}°C`;
}

/**
 * Format a distance/visibility range for display
 * @param range - Distance range in centimeters (canonical fixed-point)
 * @param depthUnit - Target unit ('ft' or 'm')
 * @returns Formatted string like "15-25m" or "50-100ft"
 */
export function formatDistanceRange(
  range: { min: number; max: number } | null,
  depthUnit: DepthUnit
): string {
  if (!range) return "Data unavailable";

  if (depthUnit === "ft") {
    const minFt = Math.round(cmToFeet(range.min));
    const maxFt = Math.round(cmToFeet(range.max));
    if (minFt === maxFt) {
      return `${minFt}ft`;
    }
    return `${minFt}-${maxFt}ft`;
  }

  // Meters
  const minM = Math.round(cmToMeters(range.min));
  const maxM = Math.round(cmToMeters(range.max));
  if (minM === maxM) {
    return `${minM}m`;
  }
  return `${minM}-${maxM}m`;
}
