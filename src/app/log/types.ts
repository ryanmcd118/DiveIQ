import type { DiveLog } from '@prisma/client';

export type DiveLogEntry = DiveLog;
export type DiveLogInput = Omit<DiveLogEntry, 'id' | 'createdAt'>;
