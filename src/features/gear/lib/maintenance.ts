import { DUE_SOON_DAYS } from "../constants";
import type { GearItem } from "@prisma/client";

/**
 * Maintenance status enum
 */
export type MaintenanceStatus =
  | "NO_SCHEDULE"
  | "UNKNOWN"
  | "UP_TO_DATE"
  | "DUE_SOON"
  | "OVERDUE";

/**
 * Compute the next service due date for a gear item
 * Returns null if no schedule or insufficient data
 */
export function getNextServiceDueAt(
  gearItem: Pick<GearItem, "lastServicedAt" | "serviceIntervalMonths">
): Date | null {
  if (!gearItem.serviceIntervalMonths || !gearItem.lastServicedAt) {
    return null;
  }

  const lastServiced = new Date(gearItem.lastServicedAt);
  const nextDue = new Date(lastServiced);
  nextDue.setMonth(nextDue.getMonth() + gearItem.serviceIntervalMonths);
  return nextDue;
}

/**
 * Compute maintenance status for a gear item
 */
export function computeMaintenanceStatus(
  gearItem: Pick<GearItem, "lastServicedAt" | "serviceIntervalMonths">
): MaintenanceStatus {
  // No schedule set
  if (!gearItem.serviceIntervalMonths) {
    return "NO_SCHEDULE";
  }

  // Schedule set but never serviced
  if (!gearItem.lastServicedAt) {
    return "UNKNOWN";
  }

  const nextDue = getNextServiceDueAt(gearItem);
  if (!nextDue) {
    return "UNKNOWN";
  }

  const now = new Date();
  const daysUntilDue = Math.ceil(
    (nextDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysUntilDue < 0) {
    return "OVERDUE";
  }

  if (daysUntilDue <= DUE_SOON_DAYS) {
    return "DUE_SOON";
  }

  return "UP_TO_DATE";
}

/**
 * Sort gear items for maintenance due list
 * Priority: OVERDUE first, then DUE_SOON, sorted by due date (soonest first)
 */
export function sortGearByMaintenanceDue<T extends GearItem>(
  items: T[],
  getStatus: (item: T) => MaintenanceStatus
): T[] {
  return [...items].sort((a, b) => {
    const statusA = getStatus(a);
    const statusB = getStatus(b);

    // Status priority: OVERDUE > DUE_SOON > others
    const statusPriority: Record<MaintenanceStatus, number> = {
      OVERDUE: 0,
      DUE_SOON: 1,
      UP_TO_DATE: 2,
      UNKNOWN: 3,
      NO_SCHEDULE: 4,
    };

    const priorityDiff = statusPriority[statusA] - statusPriority[statusB];
    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    // If both are OVERDUE or DUE_SOON, sort by due date
    if (statusA === "OVERDUE" || statusA === "DUE_SOON") {
      const dueA = getNextServiceDueAt(a);
      const dueB = getNextServiceDueAt(b);
      if (dueA && dueB) {
        return dueA.getTime() - dueB.getTime();
      }
      if (dueA) return -1;
      if (dueB) return 1;
    }

    return 0;
  });
}

