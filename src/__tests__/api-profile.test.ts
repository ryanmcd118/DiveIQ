import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock next-auth
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

// Mock authOptions
vi.mock("@/features/auth/lib/auth", () => ({
  authOptions: {},
}));

// Mock Prisma — profile route uses prisma directly
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    userProfileKit: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    gearKit: {
      findMany: vi.fn(),
    },
  },
}));

import { GET, PATCH } from "@/app/api/profile/route";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

// ── Helpers ─────────────────────────────────────────────────────────────

const USER_ID = "user-123";

function mockAuth(overrides: Record<string, unknown> = {}) {
  vi.mocked(getServerSession).mockResolvedValue({
    user: { id: USER_ID, email: "diver@example.com", ...overrides },
    expires: "2099-01-01",
  } as any);
}

function mockNoAuth() {
  vi.mocked(getServerSession).mockResolvedValue(null);
}

function makePatch(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost:3000/api/profile", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

const mockUser = {
  id: USER_ID,
  email: "diver@example.com",
  firstName: "Jane",
  lastName: "Diver",
  image: null,
  avatarUrl: null,
  birthday: null,
  location: "Florida",
  bio: "I love diving",
  pronouns: null,
  website: "https://example.com",
  homeDiveRegion: "Caribbean",
  languages: null,
  primaryDiveTypes: null,
  experienceLevel: "Intermediate",
  yearsDiving: 5,
  certifyingAgency: "PADI",
  typicalDivingEnvironment: null,
  lookingFor: null,
  favoriteDiveLocation: "Cozumel",
  showCertificationsOnProfile: true,
  showGearOnProfile: true,
  profileKits: [],
};

// ── Tests ───────────────────────────────────────────────────────────────

describe("profile API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Auth guard ──────────────────────────────────────────────────────

  describe("auth guard", () => {
    it("GET returns 401 when unauthenticated", async () => {
      mockNoAuth();
      const res = await GET();
      expect(res.status).toBe(401);
    });

    it("PATCH returns 401 when unauthenticated", async () => {
      mockNoAuth();
      const res = await PATCH(makePatch({ bio: "test" }));
      expect(res.status).toBe(401);
    });

    it("GET returns 401 when user.id is empty string", async () => {
      mockAuth({ id: "" });
      const res = await GET();
      expect(res.status).toBe(401);
    });

    it("PATCH returns 401 when user.id is missing", async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: "diver@example.com" },
        expires: "2099-01-01",
      } as any);
      const res = await PATCH(makePatch({ bio: "test" }));
      expect(res.status).toBe(401);
    });
  });

  // ── GET ─────────────────────────────────────────────────────────────

  describe("GET /api/profile", () => {
    beforeEach(() => {
      mockAuth();
    });

    it("returns user profile when found by ID", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.user).toBeDefined();
      expect(data.user.id).toBe(USER_ID);
      expect(data.user.email).toBe("diver@example.com");
      expect(data.user.firstName).toBe("Jane");
      expect(data.user.lastName).toBe("Diver");
      expect(data.user.experienceLevel).toBe("Intermediate");
    });

    it("falls back to email lookup when ID not found", async () => {
      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce(null) // First call: by ID → not found
        .mockResolvedValueOnce(mockUser as any); // Second call: by email → found

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.user.id).toBe(USER_ID);
      // Verify two findUnique calls were made
      expect(prisma.user.findUnique).toHaveBeenCalledTimes(2);
    });

    it("returns 500 when user not found by any method and no email", async () => {
      // Session with no email — can't recover
      mockAuth({ email: undefined });
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toContain("Unable to load");
    });

    it("returns 500 on database error", async () => {
      vi.mocked(prisma.user.findUnique).mockRejectedValue(
        new Error("DB error")
      );

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe("Internal Server Error");
    });

    it("transforms profileKits to simpler structure", async () => {
      const userWithKits = {
        ...mockUser,
        profileKits: [
          {
            kitId: "kit-1",
            kit: {
              id: "kit-1",
              name: "Tropical Kit",
              kitItems: [
                {
                  gearItem: {
                    id: "gear-1",
                    type: "WETSUIT",
                    manufacturer: "O'Neill",
                    model: "3mm",
                    purchaseDate: null,
                  },
                },
              ],
            },
          },
        ],
      };
      vi.mocked(prisma.user.findUnique).mockResolvedValue(userWithKits as any);

      const res = await GET();
      const data = await res.json();

      expect(data.user.profileKitIds).toEqual(["kit-1"]);
      expect(data.user.profileKits[0].id).toBe("kit-1");
      expect(data.user.profileKits[0].name).toBe("Tropical Kit");
      expect(data.user.profileKits[0].items[0].type).toBe("WETSUIT");
    });
  });

  // ── PATCH ───────────────────────────────────────────────────────────

  describe("PATCH /api/profile", () => {
    beforeEach(() => {
      mockAuth();
      // Default: update succeeds, re-fetch returns updated user
      vi.mocked(prisma.user.update).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        ...mockUser,
        profileKits: [],
      } as any);
    });

    describe("field updates", () => {
      it("updates basic profile fields", async () => {
        const res = await PATCH(
          makePatch({
            firstName: "Updated",
            bio: "New bio",
            location: "Hawaii",
          })
        );
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.user).toBeDefined();
        expect(prisma.user.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: USER_ID },
            data: expect.objectContaining({
              firstName: "Updated",
              bio: "New bio",
              location: "Hawaii",
            }),
          })
        );
      });

      it("only updates provided fields (partial update)", async () => {
        await PATCH(makePatch({ bio: "Just bio" }));

        const updateCall = vi.mocked(prisma.user.update).mock.calls[0][0];
        const data = updateCall.data as Record<string, unknown>;
        // bio should be present, firstName should NOT
        expect(data.bio).toBe("Just bio");
        expect(data).not.toHaveProperty("firstName");
        expect(data).not.toHaveProperty("location");
      });
    });

    describe("string normalization", () => {
      it("trims and nullifies empty strings", async () => {
        await PATCH(makePatch({ bio: "", location: "  " }));

        expect(prisma.user.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              bio: null,
              location: null,
            }),
          })
        );
      });

      it("trims whitespace from string values", async () => {
        await PATCH(makePatch({ bio: "  Hello world  " }));

        expect(prisma.user.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              bio: "Hello world",
            }),
          })
        );
      });
    });

    describe("website URL normalization", () => {
      it("prepends https:// when no protocol", async () => {
        await PATCH(makePatch({ website: "example.com" }));

        expect(prisma.user.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              website: "https://example.com",
            }),
          })
        );
      });

      it("preserves existing https:// prefix", async () => {
        await PATCH(makePatch({ website: "https://example.com" }));

        expect(prisma.user.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              website: "https://example.com",
            }),
          })
        );
      });

      it("preserves http:// prefix", async () => {
        await PATCH(makePatch({ website: "http://example.com" }));

        expect(prisma.user.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              website: "http://example.com",
            }),
          })
        );
      });

      it("nullifies empty website", async () => {
        await PATCH(makePatch({ website: "" }));

        expect(prisma.user.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              website: null,
            }),
          })
        );
      });
    });

    describe("validation", () => {
      it("returns 400 when firstName exceeds 50 characters", async () => {
        const res = await PATCH(makePatch({ firstName: "a".repeat(51) }));
        const data = await res.json();

        expect(res.status).toBe(400);
        expect(data.error).toContain("50 characters");
      });

      it("returns 400 when bio exceeds 500 characters", async () => {
        const res = await PATCH(makePatch({ bio: "a".repeat(501) }));
        const data = await res.json();

        expect(res.status).toBe(400);
        expect(data.error).toContain("500 characters");
      });

      it("returns 400 for invalid website URL after normalization", async () => {
        const res = await PATCH(makePatch({ website: "not a valid url" }));
        const data = await res.json();

        expect(res.status).toBe(400);
        expect(data.error).toContain("valid website");
      });

      it("returns 400 for invalid birthday format", async () => {
        const res = await PATCH(makePatch({ birthday: "not-a-date" }));
        const data = await res.json();

        expect(res.status).toBe(400);
        expect(data.error).toContain("birthday");
      });

      it("returns 400 when profileKitIds is not an array", async () => {
        const res = await PATCH(makePatch({ profileKitIds: "not-an-array" }));
        const data = await res.json();

        expect(res.status).toBe(400);
        expect(data.error).toContain("profileKitIds");
      });
    });

    describe("boolean fields", () => {
      it("converts showGearOnProfile to boolean", async () => {
        await PATCH(makePatch({ showGearOnProfile: false }));

        expect(prisma.user.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              showGearOnProfile: false,
            }),
          })
        );
      });

      it("converts showCertificationsOnProfile to boolean", async () => {
        await PATCH(makePatch({ showCertificationsOnProfile: true }));

        expect(prisma.user.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              showCertificationsOnProfile: true,
            }),
          })
        );
      });
    });

    describe("error handling", () => {
      it("returns 500 on database error during update", async () => {
        vi.mocked(prisma.user.update).mockRejectedValue(new Error("DB error"));

        const res = await PATCH(makePatch({ bio: "test" }));
        const data = await res.json();

        expect(res.status).toBe(500);
        expect(data.error).toBe("Internal Server Error");
      });
    });
  });
});
