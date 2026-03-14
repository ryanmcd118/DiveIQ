import { describe, it, expect } from "vitest";
import { normalizeProfileUpdate } from "@/features/profile/utils/normalizeProfile";

describe("normalizeProfileUpdate", () => {
  // ── String normalization ──────────────────────────────────────────────

  it("trims whitespace from string fields", () => {
    const result = normalizeProfileUpdate({ bio: "  Hello world  " });
    expect(result.data.bio).toBe("Hello world");
    expect(result.validationError).toBeUndefined();
  });

  it("converts empty strings to null", () => {
    const result = normalizeProfileUpdate({ bio: "", location: "  " });
    expect(result.data.bio).toBeNull();
    expect(result.data.location).toBeNull();
  });

  it("only includes provided fields in data", () => {
    const result = normalizeProfileUpdate({ bio: "test" });
    expect(result.data).toHaveProperty("bio");
    expect(result.data).not.toHaveProperty("firstName");
    expect(result.data).not.toHaveProperty("location");
  });

  // ── Website URL normalization ─────────────────────────────────────────

  it("prepends https:// when no protocol", () => {
    const result = normalizeProfileUpdate({ website: "example.com" });
    expect(result.data.website).toBe("https://example.com");
  });

  it("preserves existing https:// prefix", () => {
    const result = normalizeProfileUpdate({ website: "https://example.com" });
    expect(result.data.website).toBe("https://example.com");
  });

  it("preserves existing http:// prefix", () => {
    const result = normalizeProfileUpdate({ website: "http://example.com" });
    expect(result.data.website).toBe("http://example.com");
  });

  it("nullifies empty website", () => {
    const result = normalizeProfileUpdate({ website: "" });
    expect(result.data.website).toBeNull();
  });

  it("returns validation error for invalid website URL", () => {
    const result = normalizeProfileUpdate({ website: "not a valid url" });
    expect(result.validationError).toBeDefined();
    expect(result.validationError!.error).toContain("valid website");
    expect(result.validationError!.status).toBe(400);
  });

  // ── Boolean coercion ──────────────────────────────────────────────────

  it("coerces showGearOnProfile to boolean", () => {
    const result = normalizeProfileUpdate({ showGearOnProfile: false });
    expect(result.data.showGearOnProfile).toBe(false);
  });

  it("coerces showCertificationsOnProfile to boolean", () => {
    const result = normalizeProfileUpdate({
      showCertificationsOnProfile: true,
    });
    expect(result.data.showCertificationsOnProfile).toBe(true);
  });

  // ── Validation errors ─────────────────────────────────────────────────

  it("returns error when firstName exceeds 50 chars", () => {
    const result = normalizeProfileUpdate({ firstName: "a".repeat(51) });
    expect(result.validationError).toBeDefined();
    expect(result.validationError!.error).toContain("50 characters");
  });

  it("returns error when bio exceeds 500 chars", () => {
    const result = normalizeProfileUpdate({ bio: "a".repeat(501) });
    expect(result.validationError).toBeDefined();
    expect(result.validationError!.error).toContain("500 characters");
  });

  it("returns error for invalid birthday format", () => {
    const result = normalizeProfileUpdate({ birthday: "not-a-date" });
    expect(result.validationError).toBeDefined();
    expect(result.validationError!.error).toContain("birthday");
  });

  it("returns error when profileKitIds is not an array", () => {
    const result = normalizeProfileUpdate({ profileKitIds: "not-array" });
    expect(result.validationError).toBeDefined();
    expect(result.validationError!.error).toContain("profileKitIds");
  });

  // ── JSON array fields ─────────────────────────────────────────────────

  it("passes through valid JSON arrays", () => {
    const result = normalizeProfileUpdate({
      primaryDiveTypes: '["reef","wreck"]',
    });
    expect(result.validationError).toBeUndefined();
    expect(result.data.primaryDiveTypes).toBe('["reef","wreck"]');
  });

  it("returns error for invalid JSON in array fields", () => {
    const result = normalizeProfileUpdate({
      primaryDiveTypes: "not json",
    });
    expect(result.validationError).toBeDefined();
    expect(result.validationError!.error).toContain("primaryDiveTypes");
    expect(result.validationError!.error).toContain("JSON array");
  });

  it("returns error when JSON array field is an object", () => {
    const result = normalizeProfileUpdate({
      lookingFor: '{"key": "value"}',
    });
    expect(result.validationError).toBeDefined();
    expect(result.validationError!.error).toContain("lookingFor");
  });

  // ── Birthday parsing ──────────────────────────────────────────────────

  it("parses valid birthday to noon UTC", () => {
    const result = normalizeProfileUpdate({ birthday: "1990-06-15" });
    expect(result.validationError).toBeUndefined();
    const bd = result.data.birthday as Date;
    expect(bd.getUTCHours()).toBe(12);
    expect(bd.getUTCFullYear()).toBe(1990);
    expect(bd.getUTCMonth()).toBe(5); // June = 5
    expect(bd.getUTCDate()).toBe(15);
  });

  it("sets birthday to null when empty string", () => {
    const result = normalizeProfileUpdate({ birthday: "" });
    expect(result.data.birthday).toBeNull();
  });

  // ── yearsDiving ───────────────────────────────────────────────────────

  it("normalizes yearsDiving to integer", () => {
    const result = normalizeProfileUpdate({ yearsDiving: "10" });
    expect(result.data.yearsDiving).toBe(10);
  });

  it("sets yearsDiving to null for empty value", () => {
    const result = normalizeProfileUpdate({ yearsDiving: "" });
    expect(result.data.yearsDiving).toBeNull();
  });
});
