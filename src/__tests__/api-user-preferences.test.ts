import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/features/auth/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { GET, PATCH } from "@/app/api/user/preferences/route";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

const USER_ID = "user-123";
function mockAuth() {
  vi.mocked(getServerSession).mockResolvedValue({
    user: { id: USER_ID, email: "d@e.com" },
    expires: "2099-01-01",
  } as any);
}
function mockNoAuth() {
  vi.mocked(getServerSession).mockResolvedValue(null);
}

function makePatch(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost:3000/api/user/preferences", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("user preferences API", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("GET /api/user/preferences", () => {
    it("returns 401 when unauthenticated", async () => {
      mockNoAuth();
      const req = new NextRequest("http://localhost:3000/api/user/preferences");
      expect((await GET(req)).status).toBe(401);
    });

    it("returns stored preferences", async () => {
      mockAuth();
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        unitPreferences: {
          depth: "m",
          temperature: "c",
          pressure: "bar",
          weight: "kg",
        },
      } as any);

      const req = new NextRequest("http://localhost:3000/api/user/preferences");
      const data = await (await GET(req)).json();

      expect(data.preferences.depth).toBe("m");
      expect(data.preferences.temperature).toBe("c");
    });

    it("returns defaults when no preferences set", async () => {
      mockAuth();
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        unitPreferences: null,
      } as any);

      const req = new NextRequest("http://localhost:3000/api/user/preferences");
      const data = await (await GET(req)).json();

      // DEFAULT_UNIT_PREFERENCES is imperial
      expect(data.preferences.depth).toBe("ft");
      expect(data.preferences.temperature).toBe("f");
      expect(data.preferences.pressure).toBe("psi");
      expect(data.preferences.weight).toBe("lb");
    });

    it("merges partial stored prefs with defaults", async () => {
      mockAuth();
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        unitPreferences: { depth: "m" },
      } as any);

      const req = new NextRequest("http://localhost:3000/api/user/preferences");
      const data = await (await GET(req)).json();

      expect(data.preferences.depth).toBe("m");
      expect(data.preferences.temperature).toBe("f"); // default
    });

    it("returns 404 when user not found", async () => {
      mockAuth();
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const req = new NextRequest("http://localhost:3000/api/user/preferences");
      expect((await GET(req)).status).toBe(404);
    });

    it("returns 500 on error", async () => {
      mockAuth();
      vi.mocked(prisma.user.findUnique).mockRejectedValue(new Error("DB"));

      const req = new NextRequest("http://localhost:3000/api/user/preferences");
      expect((await GET(req)).status).toBe(500);
    });
  });

  describe("PATCH /api/user/preferences", () => {
    it("returns 401 when unauthenticated", async () => {
      mockNoAuth();
      const res = await PATCH(
        makePatch({
          depth: "m",
          temperature: "c",
          pressure: "bar",
          weight: "kg",
        })
      );
      expect(res.status).toBe(401);
    });

    it("returns 400 for invalid preferences (Zod)", async () => {
      mockAuth();
      const res = await PATCH(makePatch({ depth: "invalid" }));
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain("Invalid");
      expect(data.details).toBeDefined();
    });

    it("returns 400 for partial preferences (all fields required)", async () => {
      mockAuth();
      const res = await PATCH(makePatch({ depth: "m" }));
      expect(res.status).toBe(400);
    });

    it("updates preferences on happy path", async () => {
      mockAuth();
      vi.mocked(prisma.user.update).mockResolvedValue({} as any);

      const prefs = {
        depth: "m",
        temperature: "c",
        pressure: "bar",
        weight: "kg",
      };
      const res = await PATCH(makePatch(prefs));
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.preferences).toEqual(prefs);
    });

    it("saves preferences to database", async () => {
      mockAuth();
      vi.mocked(prisma.user.update).mockResolvedValue({} as any);

      const prefs = {
        depth: "ft",
        temperature: "f",
        pressure: "psi",
        weight: "lb",
      };
      await PATCH(makePatch(prefs));

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: USER_ID },
        data: { unitPreferences: prefs },
      });
    });

    it("returns 500 on error", async () => {
      mockAuth();
      vi.mocked(prisma.user.update).mockRejectedValue(new Error("DB"));

      const res = await PATCH(
        makePatch({
          depth: "m",
          temperature: "c",
          pressure: "bar",
          weight: "kg",
        })
      );
      expect(res.status).toBe(500);
    });
  });
});
