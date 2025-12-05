import type { DiveLog } from "@prisma/client";

// Dive Log Types
export type DiveLogEntry = DiveLog;

export type DiveLogInput = Omit<DiveLogEntry, "id" | "createdAt">;

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


