import type { GearItem } from "@prisma/client";
import type { MaintenanceStatus } from "./maintenance";
import { type GearType, formatGearTypeLabel } from "../constants";

export function getPrimaryTitle(item: GearItem): string {
  if (item.manufacturer && item.model) {
    return `${item.manufacturer} ${item.model}`;
  }
  if (item.manufacturer) {
    return item.manufacturer;
  }
  if (item.model) {
    return item.model;
  }
  if (item.nickname) {
    return item.nickname;
  }
  return formatGearTypeLabel(item.type as GearType);
}

export function getSecondaryText(item: GearItem): string | null {
  if (item.nickname) {
    const primary = getPrimaryTitle(item);
    if (item.nickname !== primary) {
      return item.nickname;
    }
  }
  return null;
}

export function getStatusLabel(status: MaintenanceStatus): string {
  switch (status) {
    case "NO_SCHEDULE":
      return "No schedule";
    case "UNKNOWN":
      return "Unknown";
    case "UP_TO_DATE":
      return "Up to date";
    case "DUE_SOON":
      return "Due soon";
    case "OVERDUE":
      return "Overdue";
    default:
      return "";
  }
}

export function formatDate(date: Date | null): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}
