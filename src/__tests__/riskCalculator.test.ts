import { describe, it, expect } from "vitest";
import {
  calculateRiskLevel,
  scoreDepthVsCert,
  scoreEnvironment,
  scoreExperienceGap,
  scoreDiveCount,
  scoreNdlProximity,
  resolveHighestCert,
} from "@/features/dive-plan/services/riskCalculator";
import type { RiskInput } from "@/features/dive-plan/services/riskCalculator";

function makeInput(overrides: Partial<RiskInput> = {}): RiskInput {
  return {
    maxDepthMeters: 18,
    bottomTime: 40,
    region: "",
    siteName: "",
    ...overrides,
  };
}

// ── resolveHighestCert ────────────────────────────────────────────────────

describe("resolveHighestCert", () => {
  it("returns Open Water for OW cert", () => {
    expect(resolveHighestCert(["Open Water Diver"])).toEqual({
      name: "Open Water",
      depthLimitFt: 60,
    });
  });

  it("returns AOW when both OW and AOW are present", () => {
    const result = resolveHighestCert([
      "Open Water Diver",
      "Advanced Open Water Diver",
      "Enriched Air Nitrox",
    ]);
    expect(result).toEqual({ name: "Advanced Open Water", depthLimitFt: 100 });
  });

  it("returns Unknown/60ft for empty array", () => {
    expect(resolveHighestCert([])).toEqual({
      name: "Unknown",
      depthLimitFt: 60,
    });
  });

  it("recognizes Divemaster", () => {
    expect(resolveHighestCert(["Divemaster"])).toEqual({
      name: "Divemaster",
      depthLimitFt: 130,
    });
  });
});

// ── scoreDepthVsCert ──────────────────────────────────────────────────────

describe("scoreDepthVsCert", () => {
  it("returns 0 for shallow dive with no certs (defaults to 60ft limit)", () => {
    expect(scoreDepthVsCert(makeInput({ maxDepthMeters: 5 }))).toBe(0);
  });

  it("returns 4 when depth exceeds cert limit", () => {
    // 25m = ~82ft, OW limit = 60ft → ratio > 1.0
    expect(
      scoreDepthVsCert(
        makeInput({
          maxDepthMeters: 25,
          certifications: ["Open Water Diver"],
        })
      )
    ).toBe(4);
  });

  it("returns 3 when depth is 90-100% of cert limit", () => {
    // AOW limit = 100ft, 28m = ~92ft → ratio ~0.92
    expect(
      scoreDepthVsCert(
        makeInput({
          maxDepthMeters: 28,
          certifications: ["Advanced Open Water Diver"],
        })
      )
    ).toBe(3);
  });

  it("uses highestCert when certifications not provided", () => {
    expect(
      scoreDepthVsCert(
        makeInput({
          maxDepthMeters: 25,
          highestCert: "Open Water Diver",
        })
      )
    ).toBe(4);
  });
});

// ── scoreEnvironment ──────────────────────────────────────────────────────

describe("scoreEnvironment", () => {
  it("returns 0 for normal tropical site", () => {
    expect(scoreEnvironment("Caribbean", "Blue Hole")).toBe(0);
  });

  it("returns 3 for Antarctica", () => {
    expect(scoreEnvironment("Antarctica", "Glacier Bay")).toBe(3);
  });

  it("returns 3 for cave diving", () => {
    expect(scoreEnvironment("Mexico", "Cenote Cave System")).toBe(3);
  });

  it("caps at 4 even with multiple keywords", () => {
    expect(scoreEnvironment("Arctic", "Ice Cave with Drift Current")).toBe(4);
  });

  it("returns 1 for wreck dive", () => {
    expect(scoreEnvironment("Pacific", "WWII Wreck")).toBe(1);
  });

  it("returns 1 for lake/altitude", () => {
    expect(scoreEnvironment("Colorado", "Mountain Lake")).toBe(1);
  });

  it("handles empty strings", () => {
    expect(scoreEnvironment("", "")).toBe(0);
  });
});

// ── scoreExperienceGap ──────────────────────────────────────────────────

describe("scoreExperienceGap", () => {
  it("returns 0 for recent dive", () => {
    expect(
      scoreExperienceGap(
        makeInput({
          lastDiveDate: "2026-02-01",
          planDate: "2026-03-01",
        })
      )
    ).toBe(0);
  });

  it("returns 2 for 6-12 month gap", () => {
    expect(
      scoreExperienceGap(
        makeInput({
          lastDiveDate: "2025-06-01",
          planDate: "2026-03-01",
        })
      )
    ).toBe(2);
  });

  it("returns 3 for 12+ month gap", () => {
    expect(
      scoreExperienceGap(
        makeInput({
          lastDiveDate: "2024-01-01",
          planDate: "2026-03-01",
        })
      )
    ).toBe(3);
  });

  it("parses lastDiveRecency string for public users", () => {
    expect(
      scoreExperienceGap(makeInput({ lastDiveRecency: "12+ months ago" }))
    ).toBe(3);

    expect(
      scoreExperienceGap(makeInput({ lastDiveRecency: "6-12 months ago" }))
    ).toBe(2);

    expect(
      scoreExperienceGap(makeInput({ lastDiveRecency: "Within 3 months" }))
    ).toBe(0);
  });

  it("returns 0 when no data provided", () => {
    expect(scoreExperienceGap(makeInput())).toBe(0);
  });
});

// ── scoreDiveCount ──────────────────────────────────────────────────────

describe("scoreDiveCount", () => {
  it("returns 3 for fewer than 10 dives", () => {
    expect(scoreDiveCount(makeInput({ totalDives: 5 }))).toBe(3);
  });

  it("returns 2 for 10-24 dives", () => {
    expect(scoreDiveCount(makeInput({ totalDives: 15 }))).toBe(2);
  });

  it("returns 1 for 25-49 dives", () => {
    expect(scoreDiveCount(makeInput({ totalDives: 30 }))).toBe(1);
  });

  it("returns 0 for 50+ dives", () => {
    expect(scoreDiveCount(makeInput({ totalDives: 100 }))).toBe(0);
  });

  it("parses diveCountRange for public users", () => {
    expect(scoreDiveCount(makeInput({ diveCountRange: "0–24 dives" }))).toBe(3);
    expect(scoreDiveCount(makeInput({ diveCountRange: "25–99 dives" }))).toBe(
      1
    );
    expect(scoreDiveCount(makeInput({ diveCountRange: "100–499 dives" }))).toBe(
      0
    );
  });

  it("returns 0 when no data provided", () => {
    expect(scoreDiveCount(makeInput())).toBe(0);
  });
});

// ── scoreNdlProximity ───────────────────────────────────────────────────

describe("scoreNdlProximity", () => {
  it("returns 0 for very short dive at shallow depth", () => {
    // 10m = ~33ft, NDL ~193min, 20min/193 ≈ 0.10
    expect(
      scoreNdlProximity(makeInput({ maxDepthMeters: 10, bottomTime: 20 }))
    ).toBe(0);
  });

  it("returns 3 when bottom time approaches NDL", () => {
    // 30m = ~98ft, NDL ~21min, 20min/21 ≈ 0.95
    expect(
      scoreNdlProximity(makeInput({ maxDepthMeters: 30, bottomTime: 20 }))
    ).toBe(3);
  });

  it("returns 1 for moderate ratio", () => {
    // 18m = ~59ft, NDL ~58min, 35min/58 ≈ 0.60
    expect(
      scoreNdlProximity(makeInput({ maxDepthMeters: 18, bottomTime: 35 }))
    ).toBe(1);
  });
});

// ── calculateRiskLevel (integration) ────────────────────────────────────

describe("calculateRiskLevel", () => {
  it("returns Extreme for Antarctica ice dive at 60ft with few dives", () => {
    const result = calculateRiskLevel({
      maxDepthMeters: 18, // ~60ft
      bottomTime: 50,
      region: "Antarctica",
      siteName: "Ice Wall",
      certifications: ["Open Water Diver"],
      totalDives: 8,
      lastDiveDate: null,
    });
    expect(result).toBe("Extreme");
  });

  it("returns Low for shallow tropical dive by recent OW diver", () => {
    const result = calculateRiskLevel({
      maxDepthMeters: 9, // ~30ft
      bottomTime: 30,
      region: "Caribbean",
      siteName: "Coral Garden",
      certifications: ["Open Water Diver"],
      totalDives: 20,
      lastDiveDate: "2026-02-15",
      planDate: "2026-03-13",
    });
    expect(result).toBe("Low");
  });

  it("returns Low or Moderate for typical recreational dive", () => {
    const result = calculateRiskLevel({
      maxDepthMeters: 18, // ~60ft
      bottomTime: 40,
      region: "Thailand",
      siteName: "Koh Tao Reef",
      certifications: ["Advanced Open Water Diver"],
      totalDives: 60,
      lastDiveDate: "2026-01-15",
      planDate: "2026-03-13",
    });
    expect(["Low", "Moderate"]).toContain(result);
  });

  it("returns High or Extreme when diving at cert limit with few dives", () => {
    const result = calculateRiskLevel({
      maxDepthMeters: 30, // ~100ft = AOW limit
      bottomTime: 20,
      region: "Red Sea",
      siteName: "Blue Hole",
      certifications: ["Advanced Open Water Diver"],
      totalDives: 15,
      lastDiveDate: "2025-06-01",
      planDate: "2026-03-13",
    });
    expect(["High", "Extreme"]).toContain(result);
  });

  it("returns reasonable result with minimal input (regression)", () => {
    const result = calculateRiskLevel({
      maxDepthMeters: 18,
      bottomTime: 40,
      region: "",
      siteName: "",
    });
    expect(["Low", "Moderate", "High", "Extreme"]).toContain(result);
  });
});
