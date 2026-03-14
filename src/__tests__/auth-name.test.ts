import { describe, it, expect } from "vitest";
import { splitFullName, getDisplayName } from "@/features/auth/lib/name";

// ── splitFullName ───────────────────────────────────────────────────────

describe("splitFullName", () => {
  it("splits a simple two-part name", () => {
    expect(splitFullName("Jane Diver")).toEqual({
      firstName: "Jane",
      lastName: "Diver",
    });
  });

  it("returns firstName only for single name", () => {
    expect(splitFullName("Madonna")).toEqual({
      firstName: "Madonna",
      lastName: null,
    });
  });

  it("preserves compound last names", () => {
    expect(splitFullName("John Van Dyke")).toEqual({
      firstName: "John",
      lastName: "Van Dyke",
    });
  });

  it("preserves multi-part last names", () => {
    expect(splitFullName("Maria De la Cruz")).toEqual({
      firstName: "Maria",
      lastName: "De la Cruz",
    });
  });

  it("returns null for both when input is null", () => {
    expect(splitFullName(null)).toEqual({
      firstName: null,
      lastName: null,
    });
  });

  it("returns null for both when input is undefined", () => {
    expect(splitFullName(undefined)).toEqual({
      firstName: null,
      lastName: null,
    });
  });

  it("returns null for both when input is empty string", () => {
    expect(splitFullName("")).toEqual({
      firstName: null,
      lastName: null,
    });
  });

  it("returns null for both when input is whitespace only", () => {
    expect(splitFullName("   ")).toEqual({
      firstName: null,
      lastName: null,
    });
  });

  it("trims leading and trailing whitespace", () => {
    expect(splitFullName("  Jane Diver  ")).toEqual({
      firstName: "Jane",
      lastName: "Diver",
    });
  });

  it("collapses multiple internal spaces", () => {
    expect(splitFullName("Jane   Diver")).toEqual({
      firstName: "Jane",
      lastName: "Diver",
    });
  });

  it("handles hyphenated names", () => {
    expect(splitFullName("Mary-Jane Watson")).toEqual({
      firstName: "Mary-Jane",
      lastName: "Watson",
    });
  });

  it("handles accented characters", () => {
    expect(splitFullName("José García")).toEqual({
      firstName: "José",
      lastName: "García",
    });
  });
});

// ── getDisplayName ──────────────────────────────────────────────────────

describe("getDisplayName", () => {
  it("returns firstName + lastName when both present", () => {
    expect(getDisplayName({ firstName: "Jane", lastName: "Diver" })).toBe(
      "Jane Diver"
    );
  });

  it("returns firstName only when lastName missing", () => {
    expect(getDisplayName({ firstName: "Jane" })).toBe("Jane");
  });

  it("returns firstName only when lastName is empty string", () => {
    expect(getDisplayName({ firstName: "Jane", lastName: "" })).toBe("Jane");
  });

  it("returns firstName only when lastName is whitespace", () => {
    expect(getDisplayName({ firstName: "Jane", lastName: "  " })).toBe("Jane");
  });

  it("falls back to name field when firstName is missing", () => {
    expect(getDisplayName({ name: "Jane Diver" })).toBe("Jane Diver");
  });

  it("falls back to name field when firstName is empty", () => {
    expect(getDisplayName({ firstName: "", name: "Jane Diver" })).toBe(
      "Jane Diver"
    );
  });

  it("falls back to email prefix when no name fields", () => {
    expect(getDisplayName({ email: "jane@example.com" })).toBe("jane");
  });

  it("returns 'User' when no fields available", () => {
    expect(getDisplayName({})).toBe("User");
  });

  it("returns 'User' when all fields are null", () => {
    expect(
      getDisplayName({
        firstName: null,
        lastName: null,
        name: null,
        email: null,
      })
    ).toBe("User");
  });

  it("returns 'User' when all fields are empty strings", () => {
    expect(
      getDisplayName({
        firstName: "",
        lastName: "",
        name: "",
        email: "",
      })
    ).toBe("User");
  });

  it("prefers firstName over name field", () => {
    expect(
      getDisplayName({
        firstName: "Jane",
        name: "Different Name",
      })
    ).toBe("Jane");
  });

  it("trims whitespace from firstName and lastName", () => {
    expect(
      getDisplayName({ firstName: "  Jane  ", lastName: "  Diver  " })
    ).toBe("Jane Diver");
  });

  it("trims whitespace from firstName when lastName is missing", () => {
    expect(getDisplayName({ firstName: "  Jane  " })).toBe("Jane");
  });

  it("handles email without @ sign", () => {
    expect(getDisplayName({ email: "nodomainemail" })).toBe("nodomainemail");
  });
});
