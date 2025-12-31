/**
 * Gear type enum values
 */
export const GearType = {
  BCD: "BCD",
  REGULATOR: "REGULATOR",
  WETSUIT: "WETSUIT",
  DIVE_COMPUTER: "DIVE_COMPUTER",
  FINS: "FINS",
  MASK: "MASK",
  SNORKEL: "SNORKEL",
  TANK: "TANK",
  WEIGHTS: "WEIGHTS",
  OTHER: "OTHER",
} as const;

export type GearType = (typeof GearType)[keyof typeof GearType];

/**
 * Default service intervals in months by gear type
 * Based on standard maintenance schedules for dive equipment
 */
export const DEFAULT_SERVICE_INTERVALS: Record<GearType, number | null> = {
  [GearType.BCD]: 12,
  [GearType.REGULATOR]: 12,
  [GearType.WETSUIT]: null, // No regular service schedule
  [GearType.DIVE_COMPUTER]: 24, // Battery/service varies; 24 months as default
  [GearType.FINS]: null,
  [GearType.MASK]: null,
  [GearType.SNORKEL]: null,
  [GearType.TANK]: 12, // TODO: Visual inspection 12 months, hydrostatic 60 months - using 12 for V1
  [GearType.WEIGHTS]: null,
  [GearType.OTHER]: null,
};

/**
 * Number of days before service due date to consider "due soon"
 */
export const DUE_SOON_DAYS = 30;

/**
 * Get default service interval for a gear type
 */
export function getDefaultServiceInterval(type: GearType): number | null {
  return DEFAULT_SERVICE_INTERVALS[type] ?? null;
}

/**
 * Format gear type enum value to human-readable label
 * - Converts underscores to spaces
 * - Capitalizes first letter of first word only
 * - Preserves acronyms like BCD as-is
 */
export function formatGearTypeLabel(type: GearType): string {
  // Handle acronyms that should stay uppercase
  if (type === GearType.BCD) {
    return "BCD";
  }

  // Convert underscores to spaces and lowercase everything
  const withSpaces = type.replace(/_/g, " ").toLowerCase();

  // Capitalize first letter only
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
}
