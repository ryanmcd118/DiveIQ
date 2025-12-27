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

