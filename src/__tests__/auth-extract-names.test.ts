import { describe, it, expect } from "vitest";
import { extractNamesFromGoogleProfile } from "@/features/auth/lib/auth";

describe("Auth Helper - extractNamesFromGoogleProfile", () => {
  it("extracts names from given_name and family_name", () => {
    const profile = { given_name: "John", family_name: "Doe" };
    const result = extractNamesFromGoogleProfile(profile, {});
    expect(result.firstName).toBe("John");
    expect(result.lastName).toBe("Doe");
  });

  it("trims whitespace from given_name and family_name", () => {
    const profile = { given_name: "  Jane  ", family_name: "  Smith  " };
    const result = extractNamesFromGoogleProfile(profile, {});
    expect(result.firstName).toBe("Jane");
    expect(result.lastName).toBe("Smith");
  });

  it("splits full name when given_name/family_name not available", () => {
    const profile = { name: "Alice Johnson" };
    const result = extractNamesFromGoogleProfile(profile, {});
    expect(result.firstName).toBe("Alice");
    expect(result.lastName).toBe("Johnson");
  });

  it("handles single-word names", () => {
    const profile = { name: "Madonna" };
    const result = extractNamesFromGoogleProfile(profile, {});
    expect(result.firstName).toBe("Madonna");
    expect(result.lastName).toBeNull();
  });

  it("preserves compound last names", () => {
    const profile = { name: "John Van Dyke" };
    const result = extractNamesFromGoogleProfile(profile, {});
    expect(result.firstName).toBe("John");
    expect(result.lastName).toBe("Van Dyke");
  });

  it("handles multiple middle names correctly", () => {
    const profile = { name: "Maria Elena Rodriguez" };
    const result = extractNamesFromGoogleProfile(profile, {});
    expect(result.firstName).toBe("Maria");
    expect(result.lastName).toBe("Elena Rodriguez");
  });

  it("falls back to user.name when profile.name is missing", () => {
    const profile = {};
    const user = { name: "Bob Wilson" };
    const result = extractNamesFromGoogleProfile(profile, user);
    expect(result.firstName).toBe("Bob");
    expect(result.lastName).toBe("Wilson");
  });

  it("returns null for both when no name data available", () => {
    const result = extractNamesFromGoogleProfile({}, {});
    expect(result.firstName).toBeNull();
    expect(result.lastName).toBeNull();
  });

  it("handles empty string names", () => {
    const profile = { name: "" };
    const result = extractNamesFromGoogleProfile(profile, {});
    expect(result.firstName).toBeNull();
    expect(result.lastName).toBeNull();
  });

  it("prefers given_name/family_name over full name", () => {
    const profile = {
      given_name: "David",
      family_name: "Lee",
      name: "David Lee Sr",
    };
    const result = extractNamesFromGoogleProfile(profile, {});
    expect(result.firstName).toBe("David");
    expect(result.lastName).toBe("Lee");
  });
});
