import type { DiveLog, GearItem } from "@prisma/client";

// Dive Log Types
export type DiveLogEntry = DiveLog & {
  gearItems?: GearItem[];
};

export type DiveLogInput = Omit<
  DiveLogEntry,
  "id" | "createdAt" | "updatedAt" | "gearItems"
> & {
  gearItemIds?: string[];
};
