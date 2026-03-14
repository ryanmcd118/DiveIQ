import { describe, it, expect } from "vitest";
import { parseAIBriefing } from "@/features/dive-plan/lib/parseAIBriefing";

// ── Helper: build a valid briefing JSON string ──────────────────────────

function validBriefingJson(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    keyConsiderations: [
      "Plan depth is within your AOW cert limit",
      "Water temperature requires a 3mm wetsuit",
    ],
    conditions: {
      waterTemp: { value: "24-26°C", badge: "seasonal" },
      visibility: { value: "15-25m", badge: "forecast" },
      seaState: { value: "Calm", badge: "inferred" },
    },
    siteConditions: ["Mild current on the east wall"],
    hazards: ["Boat traffic above"],
    experienceNotes: ["With your AOW cert and 60 logged dives..."],
    gearNotes: ["Your 3mm wetsuit is appropriate"],
    ...overrides,
  });
}

// ── parseAIBriefing ─────────────────────────────────────────────────────

describe("parseAIBriefing", () => {
  describe("valid complete briefing", () => {
    it("parses all sections correctly", () => {
      const result = parseAIBriefing(validBriefingJson());

      expect(result.keyConsiderations).toEqual([
        "Plan depth is within your AOW cert limit",
        "Water temperature requires a 3mm wetsuit",
      ]);
      expect(result.conditions.waterTemp).toEqual({
        value: "24-26°C",
        badge: "seasonal",
      });
      expect(result.conditions.visibility).toEqual({
        value: "15-25m",
        badge: "forecast",
      });
      expect(result.conditions.seaState).toEqual({
        value: "Calm",
        badge: "inferred",
      });
      expect(result.siteConditions).toEqual(["Mild current on the east wall"]);
      expect(result.hazards).toEqual(["Boat traffic above"]);
      expect(result.experienceNotes).toEqual([
        "With your AOW cert and 60 logged dives...",
      ]);
      expect(result.gearNotes).toEqual(["Your 3mm wetsuit is appropriate"]);
    });

    it("caps keyConsiderations at 3 items", () => {
      const result = parseAIBriefing(
        validBriefingJson({
          keyConsiderations: ["a", "b", "c", "d", "e"],
        })
      );
      expect(result.keyConsiderations).toHaveLength(3);
      expect(result.keyConsiderations).toEqual(["a", "b", "c"]);
    });

    it("converts non-string array elements to strings", () => {
      const result = parseAIBriefing(
        validBriefingJson({
          hazards: [42, true, null],
        })
      );
      expect(result.hazards).toEqual(["42", "true", "null"]);
    });
  });

  describe("missing or empty optional sections", () => {
    it("defaults missing array sections to empty arrays", () => {
      const result = parseAIBriefing(
        JSON.stringify({
          keyConsiderations: ["one"],
          conditions: {
            waterTemp: { value: "25°C", badge: null },
            visibility: { value: "20m", badge: null },
            seaState: { value: "Calm", badge: null },
          },
        })
      );

      expect(result.keyConsiderations).toEqual(["one"]);
      expect(result.siteConditions).toEqual([]);
      expect(result.hazards).toEqual([]);
      expect(result.experienceNotes).toEqual([]);
      expect(result.gearNotes).toEqual([]);
    });

    it("defaults missing conditions to em-dash placeholders", () => {
      const result = parseAIBriefing(
        JSON.stringify({
          keyConsiderations: ["one"],
        })
      );

      expect(result.conditions.waterTemp).toEqual({
        value: "—",
        badge: null,
      });
      expect(result.conditions.visibility).toEqual({
        value: "—",
        badge: null,
      });
      expect(result.conditions.seaState).toEqual({
        value: "—",
        badge: null,
      });
    });

    it("returns empty arrays when sections are non-array types", () => {
      const result = parseAIBriefing(
        validBriefingJson({
          keyConsiderations: "not an array",
          siteConditions: 42,
          hazards: null,
          experienceNotes: { nested: true },
          gearNotes: false,
        })
      );

      expect(result.keyConsiderations).toEqual([]);
      expect(result.siteConditions).toEqual([]);
      expect(result.hazards).toEqual([]);
      expect(result.experienceNotes).toEqual([]);
      expect(result.gearNotes).toEqual([]);
    });
  });

  describe("condition card parsing", () => {
    it("returns 'Unknown' for missing value field", () => {
      const result = parseAIBriefing(
        validBriefingJson({
          conditions: {
            waterTemp: { badge: "seasonal" },
            visibility: {},
            seaState: { value: 42, badge: null },
          },
        })
      );

      expect(result.conditions.waterTemp.value).toBe("Unknown");
      expect(result.conditions.visibility.value).toBe("Unknown");
      // Non-string value defaults to "Unknown"
      expect(result.conditions.seaState.value).toBe("Unknown");
    });

    it("returns null badge for invalid badge values", () => {
      const result = parseAIBriefing(
        validBriefingJson({
          conditions: {
            waterTemp: { value: "25°C", badge: "invalid" },
            visibility: { value: "20m", badge: 42 },
            seaState: { value: "Calm", badge: null },
          },
        })
      );

      expect(result.conditions.waterTemp.badge).toBeNull();
      expect(result.conditions.visibility.badge).toBeNull();
      expect(result.conditions.seaState.badge).toBeNull();
    });

    it("accepts all valid badge values", () => {
      const result = parseAIBriefing(
        validBriefingJson({
          conditions: {
            waterTemp: { value: "25°C", badge: "seasonal" },
            visibility: { value: "20m", badge: "forecast" },
            seaState: { value: "Calm", badge: "inferred" },
          },
        })
      );

      expect(result.conditions.waterTemp.badge).toBe("seasonal");
      expect(result.conditions.visibility.badge).toBe("forecast");
      expect(result.conditions.seaState.badge).toBe("inferred");
    });

    it("handles non-object condition cards gracefully", () => {
      const result = parseAIBriefing(
        validBriefingJson({
          conditions: {
            waterTemp: "just a string",
            visibility: null,
            seaState: [1, 2, 3],
          },
        })
      );

      // Non-object inputs fall through to default
      expect(result.conditions.waterTemp).toEqual({
        value: "Unknown",
        badge: null,
      });
      expect(result.conditions.visibility).toEqual({
        value: "Unknown",
        badge: null,
      });
      expect(result.conditions.seaState).toEqual({
        value: "Unknown",
        badge: null,
      });
    });
  });

  describe("old schema detection", () => {
    it("returns empty briefing for conditionsSnapshot schema", () => {
      const result = parseAIBriefing(
        JSON.stringify({
          conditionsSnapshot: { temp: "25°C" },
          quickLook: "Looks good",
        })
      );

      expect(result.keyConsiderations).toEqual([]);
      expect(result.conditions.waterTemp.value).toBe("—");
      expect(result.siteConditions).toEqual([]);
      expect(result.hazards).toEqual([]);
      expect(result.experienceNotes).toEqual([]);
      expect(result.gearNotes).toEqual([]);
    });

    it("returns empty briefing for sections schema", () => {
      const result = parseAIBriefing(
        JSON.stringify({
          sections: [{ title: "Overview", content: "..." }],
        })
      );

      expect(result.keyConsiderations).toEqual([]);
    });

    it("returns empty briefing for whatMattersMost schema", () => {
      const result = parseAIBriefing(
        JSON.stringify({
          whatMattersMost: ["Stay shallow"],
        })
      );

      expect(result.keyConsiderations).toEqual([]);
    });

    it("does NOT trigger old schema when keyConsiderations is present", () => {
      // Even if old fields exist, keyConsiderations means new schema
      const result = parseAIBriefing(
        validBriefingJson({
          conditionsSnapshot: { temp: "25°C" },
        })
      );

      expect(result.keyConsiderations).not.toEqual([]);
      expect(result.keyConsiderations.length).toBeGreaterThan(0);
    });
  });

  describe("markdown code fence stripping", () => {
    it("strips ```json fence", () => {
      const json = validBriefingJson();
      const wrapped = "```json\n" + json + "\n```";
      const result = parseAIBriefing(wrapped);
      expect(result.keyConsiderations.length).toBeGreaterThan(0);
    });

    it("strips ``` fence without language tag", () => {
      const json = validBriefingJson();
      const wrapped = "```\n" + json + "\n```";
      const result = parseAIBriefing(wrapped);
      expect(result.keyConsiderations.length).toBeGreaterThan(0);
    });

    it("handles JSON with leading/trailing whitespace", () => {
      const json = "  \n  " + validBriefingJson() + "  \n  ";
      const result = parseAIBriefing(json);
      expect(result.keyConsiderations.length).toBeGreaterThan(0);
    });
  });

  describe("error cases", () => {
    it("throws on malformed JSON", () => {
      expect(() => parseAIBriefing("not json at all")).toThrow();
    });

    it("throws on empty string", () => {
      expect(() => parseAIBriefing("")).toThrow();
    });

    it("handles empty JSON object gracefully", () => {
      const result = parseAIBriefing("{}");
      expect(result.keyConsiderations).toEqual([]);
      expect(result.conditions.waterTemp.value).toBe("—");
      expect(result.siteConditions).toEqual([]);
      expect(result.hazards).toEqual([]);
      expect(result.experienceNotes).toEqual([]);
      expect(result.gearNotes).toEqual([]);
    });
  });
});
