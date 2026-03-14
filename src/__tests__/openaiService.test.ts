import { describe, it, expect, vi } from "vitest";

// Mock OpenAI to prevent module-level instantiation from requiring a real API key
vi.mock("openai", () => ({
  default: class {
    chat = { completions: { create: vi.fn() } };
  },
}));

import {
  parseTempToFahrenheit,
  computeGearNotes,
  getFallbackBriefing,
  buildSystemPrompt,
  buildUserPrompt,
  humanReadableDuration,
  buildGearList,
  type DivePlanAnalysisRequest,
} from "@/services/ai/openaiService";

// ── Helper: minimal valid plan ──────────────────────────────────────────

function makePlan(
  overrides: Partial<DivePlanAnalysisRequest> = {}
): DivePlanAnalysisRequest {
  return {
    region: "Caribbean",
    siteName: "Coral Garden",
    date: "2026-06-15",
    maxDepth: 18,
    bottomTime: 45,
    experienceLevel: "Intermediate",
    riskLevel: "Low",
    ...overrides,
  };
}

// ── parseTempToFahrenheit ───────────────────────────────────────────────

describe("parseTempToFahrenheit", () => {
  it("parses Celsius range and converts to Fahrenheit", () => {
    // "24-26°C" → avg 25°C → 77°F
    const result = parseTempToFahrenheit("24-26°C");
    expect(result).toBeCloseTo(77, 0);
  });

  it("parses single Celsius value", () => {
    // 25°C → 77°F
    const result = parseTempToFahrenheit("25°C");
    expect(result).toBeCloseTo(77, 0);
  });

  it("parses Fahrenheit value and returns as-is", () => {
    // "78°F" → 78 (no conversion)
    const result = parseTempToFahrenheit("78°F");
    expect(result).toBe(78);
  });

  it("parses Fahrenheit range and averages", () => {
    // "78-82°F" → avg 80
    const result = parseTempToFahrenheit("78-82°F");
    expect(result).toBe(80);
  });

  it("defaults to Fahrenheit when no unit indicator", () => {
    // No °C or °F marker → treated as raw number (Fahrenheit path)
    const result = parseTempToFahrenheit("75");
    expect(result).toBe(75);
  });

  it("returns null for strings with no numbers", () => {
    expect(parseTempToFahrenheit("warm")).toBeNull();
    expect(parseTempToFahrenheit("Check local sources")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parseTempToFahrenheit("")).toBeNull();
  });

  it("handles negative temperatures", () => {
    // "-2°C" → avg -2°C → 28.4°F
    const result = parseTempToFahrenheit("-2°C");
    expect(result).toBeCloseTo(28.4, 0);
  });

  it("handles decimal temperatures", () => {
    const result = parseTempToFahrenheit("25.5°C");
    expect(result).toBeCloseTo(77.9, 0);
  });
});

// ── computeGearNotes ────────────────────────────────────────────────────

describe("computeGearNotes", () => {
  it("returns empty array for null temperature", () => {
    expect(computeGearNotes(null, [], "Caribbean", "Reef")).toEqual([]);
  });

  describe("exposure protection recommendations", () => {
    it("recommends rash guard for 80°F+", () => {
      const notes = computeGearNotes(82, [], "Caribbean", "Reef");
      expect(notes[0]).toContain("rash guard or dive skin");
    });

    it("recommends 3mm shorty for 73-79°F", () => {
      const notes = computeGearNotes(75, [], "Pacific", "Reef");
      expect(notes[0]).toContain("3mm shorty or full wetsuit");
    });

    it("recommends 3mm full wetsuit for 68-72°F", () => {
      const notes = computeGearNotes(70, [], "Pacific", "Reef");
      expect(notes[0]).toContain("3mm full wetsuit");
    });

    it("recommends 5mm wetsuit for 60-67°F", () => {
      const notes = computeGearNotes(65, [], "Pacific", "Reef");
      expect(notes[0]).toContain("5mm wetsuit");
    });

    it("recommends 7mm wetsuit for 50-59°F", () => {
      const notes = computeGearNotes(55, [], "Pacific", "Reef");
      expect(notes[0]).toContain("7mm wetsuit");
    });

    it("recommends drysuit for sub-50°F", () => {
      const notes = computeGearNotes(45, [], "Arctic", "Ice Dive");
      expect(notes[0]).toContain("drysuit");
    });

    it("adds hood and gloves below 60°F", () => {
      const notes = computeGearNotes(55, [], "Pacific", "Reef");
      expect(notes[0]).toContain("hood");
      expect(notes[0]).toContain("gloves");
    });

    it("adds booties below 65°F", () => {
      const notes = computeGearNotes(60, [], "Pacific", "Reef");
      expect(notes[0]).toContain("booties");
    });

    it("does not add hood/gloves/booties for warm water", () => {
      const notes = computeGearNotes(80, [], "Caribbean", "Reef");
      expect(notes[0]).not.toContain("hood");
      expect(notes[0]).not.toContain("gloves");
      expect(notes[0]).not.toContain("booties");
    });
  });

  describe("site-specific gear", () => {
    it("adds dive light for cave sites", () => {
      const notes = computeGearNotes(75, [], "Mexico", "Cenote Cave");
      expect(notes[0]).toContain("dive light");
    });

    it("adds dive light for wreck sites", () => {
      const notes = computeGearNotes(75, [], "Pacific", "WWII Wreck");
      expect(notes[0]).toContain("dive light");
    });

    it("adds dive light for night dives", () => {
      const notes = computeGearNotes(75, [], "Caribbean", "Night Reef");
      expect(notes[0]).toContain("dive light");
    });

    it("adds SMB for open water/ocean", () => {
      const notes = computeGearNotes(75, [], "Open Water", "Reef");
      expect(notes[0]).toContain("SMB");
    });

    it("adds SMB for boat dives", () => {
      const notes = computeGearNotes(75, [], "Pacific", "Boat Dive");
      expect(notes[0]).toContain("SMB");
    });
  });

  describe("gear comparison with logged gear", () => {
    it("confirms adequate gear when wetsuit matches temp", () => {
      const notes = computeGearNotes(
        75,
        ["WETSUIT: 3mm shorty"],
        "Caribbean",
        "Reef"
      );
      expect(notes[1]).toContain("suitable for the expected water temperature");
    });

    it("flags inadequate gear when wetsuit is too thin", () => {
      const notes = computeGearNotes(
        55,
        ["WETSUIT: 3mm shorty"],
        "Pacific",
        "Reef"
      );
      expect(notes[1]).toContain("not appropriate");
      expect(notes[1]).toContain("55°F");
    });

    it("treats drysuit as always adequate", () => {
      const notes = computeGearNotes(40, ["WETSUIT: drysuit"], "Arctic", "Ice");
      expect(notes[1]).toContain("suitable for the expected water temperature");
    });

    it("warns when no exposure gear is logged", () => {
      const notes = computeGearNotes(
        70,
        ["MASK: Scubapro Crystal VU"],
        "Pacific",
        "Reef"
      );
      expect(notes[1]).toContain("No exposure protection logged");
      expect(notes[1]).toContain("70°F");
    });

    it("does not add gear comparison when gear list is empty", () => {
      const notes = computeGearNotes(75, [], "Caribbean", "Reef");
      expect(notes).toHaveLength(1); // Only the recommendation string
    });
  });

  describe("cold water regulator warning", () => {
    it("adds regulator warning below 50°F", () => {
      const notes = computeGearNotes(45, [], "Arctic", "Ice Dive");
      const regulatorNote = notes.find((n) => n.includes("regulator"));
      expect(regulatorNote).toBeDefined();
      expect(regulatorNote).toContain("free-flowing below 50°F");
    });

    it("does not add regulator warning at 50°F or above", () => {
      const notes = computeGearNotes(50, [], "Pacific", "Reef");
      const regulatorNote = notes.find((n) => n.includes("regulator"));
      expect(regulatorNote).toBeUndefined();
    });
  });
});

// ── getFallbackBriefing ─────────────────────────────────────────────────

describe("getFallbackBriefing", () => {
  it("returns a valid AIBriefing shape", () => {
    const plan = makePlan();
    const result = getFallbackBriefing(plan);

    expect(result.keyConsiderations).toBeInstanceOf(Array);
    expect(result.keyConsiderations.length).toBeGreaterThan(0);
    expect(result.conditions).toHaveProperty("waterTemp");
    expect(result.conditions).toHaveProperty("visibility");
    expect(result.conditions).toHaveProperty("seaState");
    expect(result.siteConditions).toBeInstanceOf(Array);
    expect(result.hazards).toBeInstanceOf(Array);
    expect(result.experienceNotes).toBeInstanceOf(Array);
    expect(result.gearNotes).toBeInstanceOf(Array);
  });

  it("includes depth in metric for metric unit system", () => {
    const result = getFallbackBriefing(makePlan({ unitSystem: "metric" }));
    expect(result.keyConsiderations[0]).toContain("18m");
    expect(result.experienceNotes[0]).toContain("18m");
  });

  it("includes depth in feet for imperial unit system", () => {
    const result = getFallbackBriefing(makePlan({ unitSystem: "imperial" }));
    // 18m ≈ 59ft
    expect(result.keyConsiderations[0]).toContain("ft");
    expect(result.experienceNotes[0]).toContain("ft");
  });

  it("includes site name in siteConditions", () => {
    const result = getFallbackBriefing(makePlan({ siteName: "Blue Hole" }));
    expect(result.siteConditions[0]).toContain("Blue Hole");
  });

  it("falls back to region when siteName is empty", () => {
    const result = getFallbackBriefing(
      makePlan({ siteName: "", region: "Red Sea" })
    );
    expect(result.siteConditions[0]).toContain("Red Sea");
  });

  it("includes month name in siteConditions", () => {
    const result = getFallbackBriefing(makePlan({ date: "2026-06-15" }));
    expect(result.siteConditions[0]).toContain("June");
  });

  it("has placeholder condition values with null badges", () => {
    const result = getFallbackBriefing(makePlan());
    expect(result.conditions.waterTemp.badge).toBeNull();
    expect(result.conditions.visibility.badge).toBeNull();
    expect(result.conditions.seaState.badge).toBeNull();
  });

  it("has empty hazards and gearNotes arrays", () => {
    const result = getFallbackBriefing(makePlan());
    expect(result.hazards).toEqual([]);
    expect(result.gearNotes).toEqual([]);
  });
});

// ── humanReadableDuration ───────────────────────────────────────────────

describe("humanReadableDuration", () => {
  it("returns 'unknown' for null fromDate", () => {
    expect(humanReadableDuration(null, "2026-06-15")).toBe("unknown");
  });

  it("returns days ago for less than 14 days", () => {
    expect(humanReadableDuration("2026-06-10", "2026-06-15")).toBe(
      "5 days ago"
    );
  });

  it("returns weeks ago for 14-59 days", () => {
    expect(humanReadableDuration("2026-05-15", "2026-06-15")).toBe(
      "4 weeks ago"
    );
  });

  it("returns months ago for 60-364 days", () => {
    expect(humanReadableDuration("2026-01-15", "2026-06-15")).toBe(
      "5 months ago"
    );
  });

  it("returns year(s) ago for 365+ days", () => {
    expect(humanReadableDuration("2024-06-15", "2026-06-15")).toBe(
      "2 years ago"
    );
  });

  it("returns singular year for exactly 1 year", () => {
    expect(humanReadableDuration("2025-06-15", "2026-06-15")).toBe(
      "1 year ago"
    );
  });

  it("returns 'in the future' for negative diff", () => {
    expect(humanReadableDuration("2026-07-01", "2026-06-15")).toBe(
      "in the future"
    );
  });

  it("returns '0 days ago' for same date", () => {
    expect(humanReadableDuration("2026-06-15", "2026-06-15")).toBe(
      "0 days ago"
    );
  });
});

// ── buildSystemPrompt ───────────────────────────────────────────────────

describe("buildSystemPrompt", () => {
  it("includes imperial unit instructions for imperial system", () => {
    const prompt = buildSystemPrompt("imperial");
    expect(prompt).toContain("FEET (ft)");
    expect(prompt).toContain("FAHRENHEIT");
  });

  it("includes metric unit instructions for metric system", () => {
    const prompt = buildSystemPrompt("metric");
    expect(prompt).toContain("meters (m)");
    expect(prompt).toContain("Celsius");
  });

  it("defaults to metric when no argument given", () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toContain("UNIT REQUIREMENTS (METRIC)");
  });

  it("includes the JSON schema structure", () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toContain("keyConsiderations");
    expect(prompt).toContain("conditions");
    expect(prompt).toContain("waterTemp");
  });

  it("includes cert depth limit rules", () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toContain("Open Water (60ft/18m)");
    expect(prompt).toContain("Advanced Open Water (100ft/30m)");
  });
});

// ── buildUserPrompt ─────────────────────────────────────────────────────

describe("buildUserPrompt", () => {
  it("includes plan data in the output", () => {
    const prompt = buildUserPrompt(makePlan());
    expect(prompt).toContain("Caribbean");
    expect(prompt).toContain("Coral Garden");
    expect(prompt).toContain("45 minutes");
    expect(prompt).toContain("Intermediate");
    expect(prompt).toContain("Low");
  });

  it("includes depth in metric by default", () => {
    const prompt = buildUserPrompt(makePlan({ maxDepth: 30 }));
    expect(prompt).toContain("30m");
  });

  it("includes depth in imperial when specified", () => {
    const prompt = buildUserPrompt(
      makePlan({ maxDepth: 30, unitSystem: "imperial" })
    );
    // 30m ≈ 98ft
    expect(prompt).toContain("98ft");
    expect(prompt).toContain("30m"); // Also includes meters in parens
  });

  it("marks update plans", () => {
    const prompt = buildUserPrompt(makePlan(), true);
    expect(prompt).toContain("(UPDATED)");
    expect(prompt).toContain("updated plan");
  });

  it("includes profile section when profile is provided", () => {
    const prompt = buildUserPrompt(
      makePlan({
        profile: {
          totalDives: 60,
          lastDiveDate: "2026-05-01",
          experienceLevel: "Intermediate",
          yearsDiving: 3,
          homeDiveRegion: "Florida Keys",
          primaryDiveTypes: ["Reef", "Wreck"],
          certifications: [
            { agency: "PADI", name: "Advanced Open Water Diver", levelRank: 2 },
          ],
          gear: [
            {
              type: "WETSUIT",
              manufacturer: "O'Neill",
              model: "Reactor 3mm",
              nickname: null,
            },
          ],
        },
      })
    );
    expect(prompt).toContain("Diver Profile:");
    expect(prompt).toContain("Total logged dives: 60");
    expect(prompt).toContain("Last dive:");
    expect(prompt).toContain("Experience level: Intermediate");
    expect(prompt).toContain("Years diving: 3");
    expect(prompt).toContain("Home dive region: Florida Keys");
    expect(prompt).toContain("Primary dive types: Reef, Wreck");
    expect(prompt).toContain("Highest certification: Advanced Open Water");
    expect(prompt).toContain("Certification depth limit: 100ft");
    expect(prompt).toContain("WETSUIT: O'Neill Reactor 3mm");
  });

  it("includes manual experience section when provided", () => {
    const prompt = buildUserPrompt(
      makePlan({
        manualExperience: {
          diveCountRange: "25-99 dives",
          lastDiveRecency: "Within 3 months",
          highestCert: "Advanced Open Water Diver",
          experienceLevel: "Intermediate",
        },
      })
    );
    expect(prompt).toContain("Diver Experience (self-reported):");
    expect(prompt).toContain("25-99 dives");
    expect(prompt).toContain("Within 3 months");
    expect(prompt).toContain("Advanced Open Water Diver");
  });

  it("shows 'Not provided' when manual experience has no cert", () => {
    const prompt = buildUserPrompt(
      makePlan({
        manualExperience: {
          diveCountRange: null,
          lastDiveRecency: null,
          highestCert: null,
          experienceLevel: "Beginner",
        },
      })
    );
    expect(prompt).toContain("Highest certification: Not provided");
  });

  it("omits profile section when neither profile nor manualExperience", () => {
    const prompt = buildUserPrompt(makePlan());
    expect(prompt).not.toContain("Diver Profile:");
    expect(prompt).not.toContain("Diver Experience (self-reported):");
  });
});

// ── buildGearList ───────────────────────────────────────────────────────

describe("buildGearList", () => {
  it("returns empty array when no profile", () => {
    expect(buildGearList(makePlan())).toEqual([]);
  });

  it("formats gear with nickname", () => {
    const result = buildGearList(
      makePlan({
        profile: {
          totalDives: 10,
          lastDiveDate: null,
          experienceLevel: null,
          yearsDiving: null,
          homeDiveRegion: null,
          primaryDiveTypes: [],
          certifications: [],
          gear: [
            {
              type: "WETSUIT",
              manufacturer: null,
              model: null,
              nickname: "My Shorty",
            },
          ],
        },
      })
    );
    expect(result).toEqual(["WETSUIT: My Shorty"]);
  });

  it("formats gear with manufacturer and model", () => {
    const result = buildGearList(
      makePlan({
        profile: {
          totalDives: 10,
          lastDiveDate: null,
          experienceLevel: null,
          yearsDiving: null,
          homeDiveRegion: null,
          primaryDiveTypes: [],
          certifications: [],
          gear: [
            {
              type: "BCD",
              manufacturer: "Scubapro",
              model: "Hydros Pro",
              nickname: null,
            },
          ],
        },
      })
    );
    expect(result).toEqual(["BCD: Scubapro Hydros Pro"]);
  });

  it("formats gear with type only when no other fields", () => {
    const result = buildGearList(
      makePlan({
        profile: {
          totalDives: 10,
          lastDiveDate: null,
          experienceLevel: null,
          yearsDiving: null,
          homeDiveRegion: null,
          primaryDiveTypes: [],
          certifications: [],
          gear: [
            {
              type: "FINS",
              manufacturer: null,
              model: null,
              nickname: null,
            },
          ],
        },
      })
    );
    expect(result).toEqual(["FINS"]);
  });

  it("prefers nickname over manufacturer/model", () => {
    const result = buildGearList(
      makePlan({
        profile: {
          totalDives: 10,
          lastDiveDate: null,
          experienceLevel: null,
          yearsDiving: null,
          homeDiveRegion: null,
          primaryDiveTypes: [],
          certifications: [],
          gear: [
            {
              type: "REGULATOR",
              manufacturer: "Apeks",
              model: "XTX50",
              nickname: "Old Faithful",
            },
          ],
        },
      })
    );
    expect(result).toEqual(["REGULATOR: Old Faithful"]);
  });
});
