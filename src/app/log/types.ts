export type DiveLogEntry = {
    id: string;
    date: string;
    region: string;
    siteName: string;
    maxDepth: number;
    bottomTime: number;
    waterTemp?: number | null;
    visibility?: number | null;
    buddyName?: string | null;
    notes?: string | null;
  };
  
  export type DiveLogInput = Omit<DiveLogEntry, 'id'>;
  