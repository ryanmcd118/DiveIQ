import type { RiskLevel } from "@/features/dive-plan/types";

export type ResolvedCert = { name: string; depthLimitFt: number };

export function resolveHighestCert(certs: string[]): ResolvedCert {
  const TIERS: { test: (n: string) => boolean; result: ResolvedCert }[] = [
    {
      test: (n) => /tec|tech|trimix|rebreather|ccr/i.test(n),
      result: { name: "Technical", depthLimitFt: 999 },
    },
    {
      test: (n) => /divemaster|(?<!\w)dm(?!\w)/i.test(n),
      result: { name: "Divemaster", depthLimitFt: 130 },
    },
    {
      test: (n) => /rescue/i.test(n),
      result: { name: "Rescue Diver", depthLimitFt: 130 },
    },
    {
      test: (n) => /deep/i.test(n),
      result: { name: "Deep Specialty", depthLimitFt: 130 },
    },
    {
      test: (n) => /advanced open water|aowd?/i.test(n),
      result: { name: "Advanced Open Water", depthLimitFt: 100 },
    },
    {
      test: (n) => /open water|owd/i.test(n) && !/advanced/i.test(n),
      result: { name: "Open Water", depthLimitFt: 60 },
    },
  ];

  let best: ResolvedCert = { name: "Unknown", depthLimitFt: 60 };
  for (const cert of certs) {
    for (const tier of TIERS) {
      if (tier.test(cert) && tier.result.depthLimitFt >= best.depthLimitFt) {
        best = tier.result;
        break;
      }
    }
  }
  return best;
}

export type RiskInput = {
  maxDepthMeters: number;
  bottomTime: number;
  region: string;
  siteName: string;
  certifications?: string[];
  highestCert?: string | null;
  totalDives?: number | null;
  diveCountRange?: string | null;
  lastDiveDate?: string | null;
  lastDiveRecency?: string | null;
  planDate?: string;
};

const METERS_TO_FEET = 3.28084;

export function scoreDepthVsCert(input: RiskInput): number {
  const certs =
    input.certifications && input.certifications.length > 0
      ? input.certifications
      : input.highestCert
        ? [input.highestCert]
        : [];

  const { depthLimitFt } = resolveHighestCert(certs);
  const depthFt = input.maxDepthMeters * METERS_TO_FEET;
  const ratio = depthFt / depthLimitFt;

  if (ratio > 1.0) return 4;
  if (ratio > 0.9) return 3;
  if (ratio > 0.75) return 2;
  if (ratio > 0.5) return 1;
  return 0;
}

export function scoreEnvironment(region: string, siteName: string): number {
  const combined = `${region} ${siteName}`.toLowerCase();
  let points = 0;

  if (/antarctica|arctic|ice/.test(combined)) points += 3;
  if (/cave|cavern/.test(combined)) points += 3;
  if (/altitude|lake/.test(combined)) points += 1;
  if (/wreck/.test(combined)) points += 1;
  if (/current|drift/.test(combined)) points += 1;

  return Math.min(points, 4);
}

export function scoreExperienceGap(input: RiskInput): number {
  const refDate = input.planDate ? new Date(input.planDate) : new Date();

  if (input.lastDiveDate) {
    const last = new Date(input.lastDiveDate);
    const diffMs = refDate.getTime() - last.getTime();
    const diffMonths = diffMs / (1000 * 60 * 60 * 24 * 30.44);
    if (diffMonths >= 12) return 3;
    if (diffMonths >= 6) return 2;
    return 0;
  }

  if (input.lastDiveRecency) {
    const r = input.lastDiveRecency.toLowerCase();
    if (/12\+|year|over a year/i.test(r)) return 3;
    if (/6.?12|6 months|3.?12/i.test(r)) return 2;
    return 0;
  }

  return 0;
}

export function scoreDiveCount(input: RiskInput): number {
  let count: number | null = null;

  if (input.totalDives != null) {
    count = input.totalDives;
  } else if (input.diveCountRange) {
    const match = input.diveCountRange.match(/(\d+)/);
    if (match) count = parseInt(match[1], 10);
  }

  if (count == null) return 0;
  if (count < 10) return 3;
  if (count < 25) return 2;
  if (count < 50) return 1;
  return 0;
}

// Standard NDL table (depth in feet → NDL in minutes)
export const NDL_TABLE: [number, number][] = [
  [30, 205],
  [40, 140],
  [50, 80],
  [60, 55],
  [70, 45],
  [80, 35],
  [90, 25],
  [100, 20],
  [110, 16],
  [120, 13],
  [130, 10],
];

export function interpolateNdl(depthFt: number): number {
  if (depthFt <= NDL_TABLE[0][0]) return NDL_TABLE[0][1];
  if (depthFt >= NDL_TABLE[NDL_TABLE.length - 1][0])
    return NDL_TABLE[NDL_TABLE.length - 1][1];

  for (let i = 0; i < NDL_TABLE.length - 1; i++) {
    const [d1, n1] = NDL_TABLE[i];
    const [d2, n2] = NDL_TABLE[i + 1];
    if (depthFt >= d1 && depthFt <= d2) {
      const fraction = (depthFt - d1) / (d2 - d1);
      return n1 + fraction * (n2 - n1);
    }
  }
  return NDL_TABLE[NDL_TABLE.length - 1][1];
}

export function scoreNdlProximity(input: RiskInput): number {
  const depthFt = input.maxDepthMeters * METERS_TO_FEET;
  const ndl = interpolateNdl(depthFt);
  const ratio = input.bottomTime / ndl;

  if (ratio > 0.9) return 3;
  if (ratio > 0.75) return 2;
  if (ratio > 0.5) return 1;
  return 0;
}

export function calculateRiskLevel(input: RiskInput): RiskLevel {
  const points =
    scoreDepthVsCert(input) +
    scoreEnvironment(input.region, input.siteName) +
    scoreExperienceGap(input) +
    scoreDiveCount(input) +
    scoreNdlProximity(input);

  if (points >= 10) return "Extreme";
  if (points >= 7) return "High";
  if (points >= 4) return "Moderate";
  return "Low";
}
