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

import { GET } from "@/app/api/me/route";
import { PATCH } from "@/app/api/me/avatar/route";
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

const mockUser = {
  id: USER_ID,
  email: "d@e.com",
  firstName: "Jane",
  lastName: "Diver",
  avatarUrl: null,
  image: null,
  password: "hashed",
  accounts: [{ provider: "google" }],
};

function makePatch(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost:3000/api/me/avatar", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("me API", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("GET /api/me", () => {
    it("returns 401 when unauthenticated", async () => {
      mockNoAuth();
      const req = new NextRequest("http://localhost:3000/api/me");
      expect((await GET(req)).status).toBe(401);
    });

    it("returns user data with auth method flags", async () => {
      mockAuth();
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      const req = new NextRequest("http://localhost:3000/api/me");
      const data = await (await GET(req)).json();

      expect(data.id).toBe(USER_ID);
      expect(data.email).toBe("d@e.com");
      expect(data.firstName).toBe("Jane");
      expect(data.hasPassword).toBe(true);
      expect(data.hasGoogle).toBe(true);
    });

    it("detects credentials-only user", async () => {
      mockAuth();
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        ...mockUser,
        accounts: [],
      } as any);
      const req = new NextRequest("http://localhost:3000/api/me");
      const data = await (await GET(req)).json();

      expect(data.hasPassword).toBe(true);
      expect(data.hasGoogle).toBe(false);
    });

    it("detects OAuth-only user", async () => {
      mockAuth();
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        ...mockUser,
        password: null,
      } as any);
      const req = new NextRequest("http://localhost:3000/api/me");
      const data = await (await GET(req)).json();

      expect(data.hasPassword).toBe(false);
      expect(data.hasGoogle).toBe(true);
    });

    it("does not leak password hash in response", async () => {
      mockAuth();
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      const req = new NextRequest("http://localhost:3000/api/me");
      const data = await (await GET(req)).json();

      expect(data.password).toBeUndefined();
      expect(JSON.stringify(data)).not.toContain("hashed");
    });

    it("returns 404 when user not found", async () => {
      mockAuth();
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      const req = new NextRequest("http://localhost:3000/api/me");
      expect((await GET(req)).status).toBe(404);
    });

    it("returns 500 on error", async () => {
      mockAuth();
      vi.mocked(prisma.user.findUnique).mockRejectedValue(new Error("DB"));
      const req = new NextRequest("http://localhost:3000/api/me");
      expect((await GET(req)).status).toBe(500);
    });
  });

  describe("PATCH /api/me/avatar", () => {
    it("returns 401 when unauthenticated", async () => {
      mockNoAuth();
      expect(
        (await PATCH(makePatch({ avatarUrl: "https://x.com/a.png" }))).status
      ).toBe(401);
    });

    it("updates avatar with valid URL", async () => {
      mockAuth();
      vi.mocked(prisma.user.update).mockResolvedValue({
        id: USER_ID,
        email: "d@e.com",
        firstName: "Jane",
        lastName: "Diver",
        avatarUrl: "https://example.com/avatar.png",
      } as any);

      const res = await PATCH(
        makePatch({ avatarUrl: "https://example.com/avatar.png" })
      );
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.user.avatarUrl).toBe("https://example.com/avatar.png");
    });

    it("clears avatar when null", async () => {
      mockAuth();
      vi.mocked(prisma.user.update).mockResolvedValue({
        id: USER_ID,
        avatarUrl: null,
      } as any);

      const res = await PATCH(makePatch({ avatarUrl: null }));
      expect(res.status).toBe(200);
    });

    it("returns 400 for non-string avatarUrl", async () => {
      mockAuth();
      const res = await PATCH(makePatch({ avatarUrl: 42 }));
      expect(res.status).toBe(400);
    });

    it("returns 400 for invalid URL", async () => {
      mockAuth();
      const res = await PATCH(makePatch({ avatarUrl: "not a url" }));
      expect(res.status).toBe(400);
    });

    it("returns 500 on error", async () => {
      mockAuth();
      vi.mocked(prisma.user.update).mockRejectedValue(new Error("DB"));
      const res = await PATCH(
        makePatch({ avatarUrl: "https://example.com/a.png" })
      );
      expect(res.status).toBe(500);
    });
  });
});
