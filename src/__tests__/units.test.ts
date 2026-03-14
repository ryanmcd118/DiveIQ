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
  psiToBar,
  barToPsi,
  pressureInputToBar,
  barToUI,
  formatPressureForDisplay,
  lbToKg,
  kgToLb,
  weightInputToKg,
  kgToUI,
  formatWeightForDisplay,
  safetyStopDepthCmToDisplay,
  distanceInputToCm,
  displayDistance,
  cmToUI,
  cx10ToUI,
  getUnitLabel,
  formatValue,
  formatInteger,
  mToFt,
  ftToM,
  cToF,
  fToC,
  parseTemperatureString,
  parseDistanceString,
  formatTemperatureRange,
  formatDistanceRange,
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

    it("returns imperial for mixed preferences", () => {
      expect(
        preferencesToUnitSystem({
          depth: "m",
          temperature: "f",
          pressure: "bar",
          weight: "kg",
        })
      ).toBe("imperial");
    });

    it("returns metric when prefs is null", () => {
      expect(preferencesToUnitSystem(null)).toBe("metric");
    });

    it("returns metric when prefs is undefined", () => {
      expect(preferencesToUnitSystem(undefined)).toBe("metric");
    });
  });

  describe("Pressure Conversions", () => {
    it("converts psi to bar correctly", () => {
      // 1 psi ≈ 0.0689476 bar
      expect(psiToBar(3000)).toBeCloseTo(206.84, 1);
      expect(psiToBar(0)).toBe(0);
    });

    it("converts bar to psi correctly", () => {
      expect(barToPsi(200)).toBeCloseTo(2900.75, 0);
      expect(barToPsi(0)).toBe(0);
    });

    it("round-trips pressure conversions", () => {
      const originalPsi = 3000;
      const bar = psiToBar(originalPsi);
      const backToPsi = barToPsi(bar);
      expect(Math.round(backToPsi)).toBe(originalPsi);
    });

    it("converts pressure input to bar (bar unit)", () => {
      expect(pressureInputToBar(200, "bar")).toBe(200);
      expect(pressureInputToBar("200", "bar")).toBe(200);
      expect(pressureInputToBar(null, "bar")).toBeNull();
      expect(pressureInputToBar("", "bar")).toBeNull();
      expect(pressureInputToBar("abc", "bar")).toBeNull();
    });

    it("converts pressure input to bar (psi unit)", () => {
      expect(pressureInputToBar(3000, "psi")).toBeCloseTo(206.84, 1);
      expect(pressureInputToBar("3000", "psi")).toBeCloseTo(206.84, 1);
      expect(pressureInputToBar(null, "psi")).toBeNull();
    });

    it("converts bar to UI value", () => {
      expect(barToUI(200, "bar")).toBe(200);
      expect(barToUI(200, "psi")).toBeCloseTo(2900.75, 0);
      expect(barToUI(null, "bar")).toBeNull();
      expect(barToUI(undefined, "psi")).toBeNull();
    });

    it("formats pressure for display", () => {
      expect(formatPressureForDisplay(200, "bar")).toBe("200");
      expect(formatPressureForDisplay(200, "psi")).toBe("2901");
      expect(formatPressureForDisplay(null, "bar")).toBe("");
      expect(formatPressureForDisplay(undefined, "psi")).toBe("");
    });
  });

  describe("Weight Conversions", () => {
    it("converts lb to kg correctly", () => {
      // 1 lb ≈ 0.453592 kg
      expect(lbToKg(10)).toBeCloseTo(4.536, 2);
      expect(lbToKg(0)).toBe(0);
    });

    it("converts kg to lb correctly", () => {
      expect(kgToLb(4.536)).toBeCloseTo(10, 0);
      expect(kgToLb(0)).toBe(0);
    });

    it("round-trips weight conversions", () => {
      const originalLb = 20;
      const kg = lbToKg(originalLb);
      const backToLb = kgToLb(kg);
      expect(Math.round(backToLb)).toBe(originalLb);
    });

    it("converts weight input to kg (kg unit)", () => {
      expect(weightInputToKg(5, "kg")).toBe(5);
      expect(weightInputToKg("5.5", "kg")).toBe(5.5);
      expect(weightInputToKg(null, "kg")).toBeNull();
      expect(weightInputToKg("", "kg")).toBeNull();
      expect(weightInputToKg("abc", "kg")).toBeNull();
    });

    it("converts weight input to kg (lb unit)", () => {
      expect(weightInputToKg(10, "lb")).toBeCloseTo(4.536, 2);
      expect(weightInputToKg("10", "lb")).toBeCloseTo(4.536, 2);
      expect(weightInputToKg(null, "lb")).toBeNull();
    });

    it("converts kg to UI value", () => {
      expect(kgToUI(5, "kg")).toBe(5);
      expect(kgToUI(5, "lb")).toBeCloseTo(11.02, 1);
      expect(kgToUI(null, "kg")).toBeNull();
      expect(kgToUI(undefined, "lb")).toBeNull();
    });

    it("formats weight for display", () => {
      // kg shows 1 decimal, lb shows integer
      expect(formatWeightForDisplay(5, "kg")).toBe("5.0");
      expect(formatWeightForDisplay(5, "lb")).toBe("11");
      expect(formatWeightForDisplay(null, "kg")).toBe("");
      expect(formatWeightForDisplay(undefined, "lb")).toBe("");
    });
  });

  describe("Safety Stop Depth Display", () => {
    it("returns default values for null/undefined", () => {
      expect(safetyStopDepthCmToDisplay(null, "m")).toBe("5");
      expect(safetyStopDepthCmToDisplay(undefined, "m")).toBe("5");
      expect(safetyStopDepthCmToDisplay(null, "ft")).toBe("15");
      expect(safetyStopDepthCmToDisplay(undefined, "ft")).toBe("15");
    });

    it("converts canonical cm to display value", () => {
      // 457cm = ~15ft = ~4.57m
      expect(safetyStopDepthCmToDisplay(457, "ft")).toBe("15");
      expect(safetyStopDepthCmToDisplay(500, "m")).toBe("5");
    });
  });

  describe("Distance Input/Display", () => {
    it("distanceInputToCm delegates to depthInputToCm", () => {
      expect(distanceInputToCm(25, "m")).toBe(depthInputToCm(25, "m"));
      expect(distanceInputToCm(100, "ft")).toBe(depthInputToCm(100, "ft"));
      expect(distanceInputToCm(null, "m")).toBeNull();
    });

    it("displayDistance delegates to displayDepth", () => {
      const depthResult = displayDepth(1500, "m");
      const distResult = displayDistance(1500, "m");
      expect(distResult).toEqual(depthResult);
    });
  });

  describe("Canonical to UI Helpers", () => {
    it("cmToUI converts to feet or meters", () => {
      expect(cmToUI(3048, "ft")).toBeCloseTo(100, 1);
      expect(cmToUI(1000, "m")).toBe(10);
      expect(cmToUI(null, "ft")).toBeNull();
      expect(cmToUI(undefined, "m")).toBeNull();
    });

    it("cx10ToUI converts to fahrenheit or celsius", () => {
      expect(cx10ToUI(250, "c")).toBe(25);
      expect(cx10ToUI(250, "f")).toBeCloseTo(77, 0);
      expect(cx10ToUI(null, "c")).toBeNull();
      expect(cx10ToUI(undefined, "f")).toBeNull();
    });
  });

  describe("getUnitLabel", () => {
    const metricPrefs = unitSystemToPreferences("metric");
    const imperialPrefs = DEFAULT_UNIT_PREFERENCES;

    it("returns correct labels for metric", () => {
      expect(getUnitLabel("depth", metricPrefs)).toBe("m");
      expect(getUnitLabel("distance", metricPrefs)).toBe("m");
      expect(getUnitLabel("temperature", metricPrefs)).toBe("°C");
      expect(getUnitLabel("pressure", metricPrefs)).toBe("bar");
      expect(getUnitLabel("weight", metricPrefs)).toBe("kg");
    });

    it("returns correct labels for imperial", () => {
      expect(getUnitLabel("depth", imperialPrefs)).toBe("ft");
      expect(getUnitLabel("temperature", imperialPrefs)).toBe("°F");
      expect(getUnitLabel("pressure", imperialPrefs)).toBe("psi");
      expect(getUnitLabel("weight", imperialPrefs)).toBe("lb");
    });
  });

  describe("Formatting Helpers", () => {
    it("formatValue formats with specified decimals", () => {
      expect(formatValue(3.14159, 2)).toBe("3.14");
      expect(formatValue(10, 1)).toBe("10.0");
      expect(formatValue(NaN)).toBe("");
      expect(formatValue(Infinity)).toBe("");
    });

    it("formatInteger rounds to nearest integer string", () => {
      expect(formatInteger(3.7)).toBe("4");
      expect(formatInteger(3.2)).toBe("3");
      expect(formatInteger(0)).toBe("0");
      expect(formatInteger(NaN)).toBe("");
      expect(formatInteger(Infinity)).toBe("");
    });
  });

  describe("Legacy Conversion Helpers", () => {
    it("mToFt converts meters to feet", () => {
      expect(mToFt(10)).toBeCloseTo(32.81, 1);
      expect(mToFt(0)).toBe(0);
    });

    it("ftToM converts feet to meters", () => {
      expect(ftToM(100)).toBeCloseTo(30.48, 1);
      expect(ftToM(0)).toBe(0);
    });

    it("cToF converts celsius to fahrenheit", () => {
      expect(cToF(0)).toBe(32);
      expect(cToF(100)).toBe(212);
    });

    it("fToC converts fahrenheit to celsius", () => {
      expect(fToC(32)).toBe(0);
      expect(fToC(212)).toBe(100);
    });
  });

  describe("parseTemperatureString", () => {
    it("parses Celsius range", () => {
      const result = parseTemperatureString("24-26°C");
      expect(result).not.toBeNull();
      expect(result!.min).toBe(cToCx10(24));
      expect(result!.max).toBe(cToCx10(26));
    });

    it("parses Fahrenheit range", () => {
      const result = parseTemperatureString("78-82°F");
      expect(result).not.toBeNull();
      expect(result!.min).toBe(fToCx10(78));
      expect(result!.max).toBe(fToCx10(82));
    });

    it("parses single Celsius value", () => {
      const result = parseTemperatureString("25°C");
      expect(result).not.toBeNull();
      expect(result!.min).toBe(cToCx10(25));
      expect(result!.max).toBe(cToCx10(25));
    });

    it("parses single Fahrenheit value", () => {
      const result = parseTemperatureString("80°F");
      expect(result).not.toBeNull();
      expect(result!.min).toBe(fToCx10(80));
      expect(result!.max).toBe(fToCx10(80));
    });

    it("returns null for empty/invalid input", () => {
      expect(parseTemperatureString("")).toBeNull();
      expect(parseTemperatureString("warm")).toBeNull();
    });
  });

  describe("parseDistanceString", () => {
    it("parses meters range", () => {
      const result = parseDistanceString("15-25m");
      expect(result).not.toBeNull();
      expect(result!.min).toBe(metersToCm(15));
      expect(result!.max).toBe(metersToCm(25));
    });

    it("parses feet range", () => {
      // Note: "ft" must be word-boundary separated (regex uses \b)
      const result = parseDistanceString("50-100 ft");
      expect(result).not.toBeNull();
      expect(result!.min).toBe(feetToCm(50));
      expect(result!.max).toBe(feetToCm(100));
    });

    it("parses single meters value", () => {
      const result = parseDistanceString("20m");
      expect(result).not.toBeNull();
      expect(result!.min).toBe(metersToCm(20));
      expect(result!.max).toBe(metersToCm(20));
    });

    it("returns null for empty/invalid input", () => {
      expect(parseDistanceString("")).toBeNull();
      expect(parseDistanceString("deep")).toBeNull();
    });
  });

  describe("formatTemperatureRange", () => {
    it("formats Celsius range", () => {
      expect(formatTemperatureRange({ min: 240, max: 260 }, "c")).toBe(
        "24-26°C"
      );
    });

    it("formats Fahrenheit range", () => {
      const result = formatTemperatureRange({ min: 250, max: 280 }, "f");
      expect(result).toMatch(/^\d+-\d+°F$/);
    });

    it("formats single value (min === max)", () => {
      expect(formatTemperatureRange({ min: 250, max: 250 }, "c")).toBe("25°C");
    });

    it("returns fallback for null", () => {
      expect(formatTemperatureRange(null, "c")).toBe("Data unavailable");
    });
  });

  describe("formatDistanceRange", () => {
    it("formats meters range", () => {
      expect(formatDistanceRange({ min: 1500, max: 2500 }, "m")).toBe("15-25m");
    });

    it("formats feet range", () => {
      expect(formatDistanceRange({ min: 1524, max: 3048 }, "ft")).toBe(
        "50-100ft"
      );
    });

    it("formats single value (min === max)", () => {
      expect(formatDistanceRange({ min: 2000, max: 2000 }, "m")).toBe("20m");
    });

    it("returns fallback for null", () => {
      expect(formatDistanceRange(null, "ft")).toBe("Data unavailable");
    });
  });
});
