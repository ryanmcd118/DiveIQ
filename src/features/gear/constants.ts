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
 */
export const DEFAULT_SERVICE_INTERVALS: Record<GearType, number | null> = {
  [GearType.BCD]: 12,
  [GearType.REGULATOR]: 12,
  [GearType.WETSUIT]: null, // No regular service schedule
  [GearType.DIVE_COMPUTER]: null, // No regular service schedule
  [GearType.FINS]: null,
  [GearType.MASK]: null,
  [GearType.SNORKEL]: null,
  [GearType.TANK]: 12, // Annual visual inspection, hydrostatic every 5 years
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

