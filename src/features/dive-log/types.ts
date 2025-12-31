import type { DiveLog, GearItem } from "@prisma/client";

// Dive Log Types
export type DiveLogEntry = DiveLog & {
  gearItems?: GearItem[];
};

export type DiveLogInput = Omit<
  DiveLogEntry,
  "id" | "createdAt" | "gearItems"
> & {
  gearItemIds?: string[];
};

// API Action Types
export type DiveLogAction = "create" | "update" | "delete";

export type DiveLogApiRequest = {
  action: DiveLogAction;
  id?: string;
  payload?: DiveLogInput;
};

export type DiveLogApiResponse = {
  entry?: DiveLogEntry;
  entries?: DiveLogEntry[];
  ok?: boolean;
};
