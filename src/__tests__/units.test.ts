import { describe, it, expect } from "vitest";
import {
  feetToCm,
  cmToFeet,
  metersToCm,
  cmToMeters,
  fToCx10,
  cx10ToF,
  cToCx10,
  cx10ToC,
  depthInputToCm,
  tempInputToCx10,
  displayDepth,
  displayTemperature,
  unitSystemToPreferences,
  preferencesToUnitSystem,
  DEFAULT_UNIT_PREFERENCES,
} from "@/lib/units";

describe("Unit Conversions - Canary Tests", () => {
  describe("Depth/Distance Conversions (Metric)", () => {
    it("converts meters to centimeters correctly", () => {
      expect(metersToCm(10)).toBe(1000);
      expect(metersToCm(1.5)).toBe(150);
      expect(metersToCm(0)).toBe(0);
    });

    it("converts centimeters to meters correctly", () => {
      expect(cmToMeters(1000)).toBe(10);
      expect(cmToMeters(150)).toBe(1.5);
      expect(cmToMeters(0)).toBe(0);
    });

    it("round-trips metric depth conversions", () => {
      const originalMeters = 25;
      const cm = metersToCm(originalMeters);
      const backToMeters = cmToMeters(cm);
      expect(Math.round(backToMeters)).toBe(originalMeters);
    });
  });

  describe("Depth/Distance Conversions (Imperial)", () => {
    it("converts feet to centimeters correctly", () => {
      // 1 ft = 30.48 cm
      expect(feetToCm(1)).toBe(30);
      expect(feetToCm(10)).toBe(305); // 10 * 30.48 = 304.8, rounded to 305
      expect(feetToCm(100)).toBe(3048);
    });

    it("converts centimeters to feet correctly", () => {
      expect(cmToFeet(3048)).toBeCloseTo(100, 1);
      expect(cmToFeet(305)).toBeCloseTo(10, 1);
      expect(cmToFeet(30)).toBeCloseTo(1, 1);
    });

    it("round-trips imperial depth conversions", () => {
      const originalFeet = 60;
      const cm = feetToCm(originalFeet);
      const backToFeet = cmToFeet(cm);
      expect(Math.round(backToFeet)).toBe(originalFeet);
    });
  });

  describe("Temperature Conversions (Metric)", () => {
    it("converts Celsius to Cx10 correctly", () => {
      expect(cToCx10(25)).toBe(250);
      expect(cToCx10(0)).toBe(0);
      expect(cToCx10(-10)).toBe(-100);
    });

    it("converts Cx10 to Celsius correctly", () => {
      expect(cx10ToC(250)).toBe(25);
      expect(cx10ToC(0)).toBe(0);
      expect(cx10ToC(-100)).toBe(-10);
    });

    it("round-trips metric temperature conversions", () => {
      const originalC = 24;
      const cx10 = cToCx10(originalC);
      const backToC = cx10ToC(cx10);
      expect(backToC).toBe(originalC);
    });
  });

  describe("Temperature Conversions (Imperial)", () => {
    it("converts Fahrenheit to Cx10 correctly", () => {
      // 32°F = 0°C = 0 Cx10
      expect(fToCx10(32)).toBe(0);
      // 77°F ≈ 25°C = 250 Cx10
      expect(fToCx10(77)).toBe(250);
      // 212°F = 100°C = 1000 Cx10
      expect(fToCx10(212)).toBe(1000);
    });

    it("converts Cx10 to Fahrenheit correctly", () => {
      expect(Math.round(cx10ToF(0))).toBe(32);
      expect(Math.round(cx10ToF(250))).toBe(77);
      expect(Math.round(cx10ToF(1000))).toBe(212);
    });

    it("round-trips imperial temperature conversions", () => {
      const originalF = 78;
      const cx10 = fToCx10(originalF);
      const backToF = cx10ToF(cx10);
      expect(Math.round(backToF)).toBe(originalF);
    });
  });

  describe("Input Conversion Helpers", () => {
    it("converts metric depth input to canonical centimeters", () => {
      expect(depthInputToCm(25, "m")).toBe(2500);
      expect(depthInputToCm("15", "m")).toBe(1500);
      expect(depthInputToCm(null, "m")).toBeNull();
    });

    it("converts imperial depth input to canonical centimeters", () => {
      expect(depthInputToCm(60, "ft")).toBe(1829); // 60 * 30.48 = 1828.8, rounded
      expect(depthInputToCm("100", "ft")).toBe(3048);
      expect(depthInputToCm(null, "ft")).toBeNull();
    });

    it("converts metric temperature input to canonical Cx10", () => {
      expect(tempInputToCx10(25, "c")).toBe(250);
      expect(tempInputToCx10("24", "c")).toBe(240);
      expect(tempInputToCx10(null, "c")).toBeNull();
    });

    it("converts imperial temperature input to canonical Cx10", () => {
      expect(tempInputToCx10(77, "f")).toBe(250);
      expect(tempInputToCx10("78", "f")).toBe(256); // 78°F ≈ 25.56°C = 256 Cx10
      expect(tempInputToCx10(null, "f")).toBeNull();
    });
  });

  describe("Display Formatting", () => {
    it("formats metric depth correctly", () => {
      const result = displayDepth(2500, "m");
      expect(result.value).toBe("25");
      expect(result.unit).toBe("m");
    });

    it("formats imperial depth correctly", () => {
      const result = displayDepth(1829, "ft");
      expect(result.value).toBe("60");
      expect(result.unit).toBe("ft");
    });

    it("formats metric temperature correctly", () => {
      const result = displayTemperature(250, "c");
      expect(result.value).toBe("25");
      expect(result.unit).toBe("°C");
    });

    it("formats imperial temperature correctly", () => {
      const result = displayTemperature(250, "f");
      expect(result.value).toBe("77");
      expect(result.unit).toBe("°F");
    });
  });

  describe("Unit System Consistency", () => {
    it("metric system produces all metric outputs", () => {
      const prefs = unitSystemToPreferences("metric");
      expect(prefs.depth).toBe("m");
      expect(prefs.temperature).toBe("c");
      expect(prefs.pressure).toBe("bar");
      expect(prefs.weight).toBe("kg");
    });

    it("imperial system produces all imperial outputs", () => {
      const prefs = unitSystemToPreferences("imperial");
      expect(prefs.depth).toBe("ft");
      expect(prefs.temperature).toBe("f");
      expect(prefs.pressure).toBe("psi");
      expect(prefs.weight).toBe("lb");
    });

    it("converts unit preferences back to unit system correctly", () => {
      const metricPrefs = unitSystemToPreferences("metric");
      expect(preferencesToUnitSystem(metricPrefs)).toBe("metric");

      const imperialPrefs = DEFAULT_UNIT_PREFERENCES;
      expect(preferencesToUnitSystem(imperialPrefs)).toBe("imperial");
    });
  });
});

