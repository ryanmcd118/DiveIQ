import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/features/auth/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    userCertification: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    certificationDefinition: {
      findUnique: vi.fn(),
    },
  },
}));

import { GET, POST } from "@/app/api/certifications/route";
import { PATCH, DELETE } from "@/app/api/certifications/[id]/route";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

const USER_ID = "user-123";

function mockAuth() {
  vi.mocked(getServerSession).mockResolvedValue({
    user: { id: USER_ID, email: "diver@example.com" },
    expires: "2099-01-01",
  } as any);
}

function mockNoAuth() {
  vi.mocked(getServerSession).mockResolvedValue(null);
}

function makePost(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost:3000/api/certifications", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

function makePatch(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost:3000/api/certifications/cert-1", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

function makeDelete(): NextRequest {
  return new NextRequest("http://localhost:3000/api/certifications/cert-1", {
    method: "DELETE",
  });
}

const idParams = { params: Promise.resolve({ id: "cert-1" }) };

const mockCert = {
  id: "cert-1",
  userId: USER_ID,
  certificationDefinitionId: "def-1",
  earnedDate: new Date("2025-01-15"),
  certNumber: "12345",
  diveShop: null,
  location: null,
  instructor: null,
  notes: null,
  isFeatured: false,
  sortOrder: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  certificationDefinition: {
    id: "def-1",
    agency: "PADI",
    name: "Open Water Diver",
    slug: "open-water-diver",
    levelRank: 1,
    category: "core",
    badgeImageUrl: null,
  },
};

const mockDefinition = {
  id: "def-1",
  agency: "PADI",
  name: "Open Water Diver",
  slug: "open-water-diver",
  levelRank: 1,
  category: "core",
  badgeImageUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("certifications API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── GET /api/certifications ─────────────────────────────────────────

  describe("GET /api/certifications", () => {
    it("returns 401 when unauthenticated", async () => {
      mockNoAuth();
      const req = new NextRequest("http://localhost:3000/api/certifications");
      const res = await GET(req);
      expect(res.status).toBe(401);
    });

    it("returns certifications for authenticated user", async () => {
      mockAuth();
      vi.mocked(prisma.userCertification.findMany).mockResolvedValue([
        mockCert,
      ] as any);

      const req = new NextRequest("http://localhost:3000/api/certifications");
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.certifications).toHaveLength(1);
      expect(data.certifications[0].certificationDefinition.name).toBe(
        "Open Water Diver"
      );
    });

    it("returns empty array when no certifications", async () => {
      mockAuth();
      vi.mocked(prisma.userCertification.findMany).mockResolvedValue([]);

      const req = new NextRequest("http://localhost:3000/api/certifications");
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.certifications).toEqual([]);
    });

    it("returns 500 on database error", async () => {
      mockAuth();
      vi.mocked(prisma.userCertification.findMany).mockRejectedValue(
        new Error("DB error")
      );

      const req = new NextRequest("http://localhost:3000/api/certifications");
      const res = await GET(req);
      expect(res.status).toBe(500);
    });
  });

  // ── POST /api/certifications ────────────────────────────────────────

  describe("POST /api/certifications", () => {
    it("returns 401 when unauthenticated", async () => {
      mockNoAuth();
      const res = await POST(makePost({ certificationDefinitionId: "def-1" }));
      expect(res.status).toBe(401);
    });

    it("returns 400 for missing required fields", async () => {
      mockAuth();
      const res = await POST(makePost({}));
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain("Invalid input");
      expect(data.details).toBeDefined();
    });

    it("returns 404 when definition does not exist", async () => {
      mockAuth();
      vi.mocked(prisma.certificationDefinition.findUnique).mockResolvedValue(
        null
      );

      const res = await POST(
        makePost({ certificationDefinitionId: "nonexistent" })
      );
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toContain("definition not found");
    });

    it("returns 409 for duplicate certification", async () => {
      mockAuth();
      vi.mocked(prisma.certificationDefinition.findUnique).mockResolvedValue(
        mockDefinition as any
      );
      vi.mocked(prisma.userCertification.findMany).mockResolvedValue([
        {
          ...mockCert,
          earnedDate: new Date("2025-01-15"),
          certNumber: "12345",
        },
      ] as any);

      const res = await POST(
        makePost({
          certificationDefinitionId: "def-1",
          earnedDate: "2025-01-15",
          certNumber: "12345",
        })
      );
      const data = await res.json();

      expect(res.status).toBe(409);
      expect(data.error).toContain("Duplicate");
    });

    it("creates certification on happy path (201)", async () => {
      mockAuth();
      vi.mocked(prisma.certificationDefinition.findUnique).mockResolvedValue(
        mockDefinition as any
      );
      vi.mocked(prisma.userCertification.findMany).mockResolvedValue([]);
      vi.mocked(prisma.userCertification.create).mockResolvedValue(
        mockCert as any
      );

      const res = await POST(makePost({ certificationDefinitionId: "def-1" }));
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.certification).toBeDefined();
      expect(data.certification.id).toBe("cert-1");
    });

    it("returns 500 on database error", async () => {
      mockAuth();
      vi.mocked(prisma.certificationDefinition.findUnique).mockResolvedValue(
        mockDefinition as any
      );
      vi.mocked(prisma.userCertification.findMany).mockResolvedValue([]);
      vi.mocked(prisma.userCertification.create).mockRejectedValue(
        new Error("DB error")
      );

      const res = await POST(makePost({ certificationDefinitionId: "def-1" }));
      expect(res.status).toBe(500);
    });
  });

  // ── PATCH /api/certifications/[id] ──────────────────────────────────

  describe("PATCH /api/certifications/[id]", () => {
    it("returns 401 when unauthenticated", async () => {
      mockNoAuth();
      const res = await PATCH(makePatch({ notes: "test" }), idParams as any);
      expect(res.status).toBe(401);
    });

    it("returns 404 when certification not found", async () => {
      mockAuth();
      vi.mocked(prisma.userCertification.findUnique).mockResolvedValue(null);

      const res = await PATCH(makePatch({ notes: "test" }), idParams as any);
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toContain("not found");
    });

    it("returns 404 when certification belongs to another user", async () => {
      mockAuth();
      vi.mocked(prisma.userCertification.findUnique).mockResolvedValue({
        ...mockCert,
        userId: "other-user",
      } as any);

      const res = await PATCH(makePatch({ notes: "test" }), idParams as any);
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toContain("not found");
    });

    it("returns 400 for invalid Zod input", async () => {
      mockAuth();
      // isFeatured must be boolean, not string
      const res = await PATCH(
        makePatch({ isFeatured: "not-a-boolean" }),
        idParams as any
      );
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain("Invalid input");
    });

    it("updates certification on happy path", async () => {
      mockAuth();
      vi.mocked(prisma.userCertification.findUnique).mockResolvedValue(
        mockCert as any
      );
      vi.mocked(prisma.userCertification.update).mockResolvedValue({
        ...mockCert,
        notes: "Updated notes",
      } as any);

      const res = await PATCH(
        makePatch({ notes: "Updated notes" }),
        idParams as any
      );
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.certification).toBeDefined();
    });

    it("returns 500 on database error", async () => {
      mockAuth();
      vi.mocked(prisma.userCertification.findUnique).mockResolvedValue(
        mockCert as any
      );
      vi.mocked(prisma.userCertification.update).mockRejectedValue(
        new Error("DB error")
      );

      const res = await PATCH(makePatch({ notes: "test" }), idParams as any);
      expect(res.status).toBe(500);
    });
  });

  // ── DELETE /api/certifications/[id] ─────────────────────────────────

  describe("DELETE /api/certifications/[id]", () => {
    it("returns 401 when unauthenticated", async () => {
      mockNoAuth();
      const res = await DELETE(makeDelete(), idParams as any);
      expect(res.status).toBe(401);
    });

    it("returns 404 when certification not found", async () => {
      mockAuth();
      vi.mocked(prisma.userCertification.findUnique).mockResolvedValue(null);

      const res = await DELETE(makeDelete(), idParams as any);
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toContain("not found");
    });

    it("returns 404 when certification belongs to another user", async () => {
      mockAuth();
      vi.mocked(prisma.userCertification.findUnique).mockResolvedValue({
        ...mockCert,
        userId: "other-user",
      } as any);

      const res = await DELETE(makeDelete(), idParams as any);
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toContain("not found");
    });

    it("deletes certification on happy path", async () => {
      mockAuth();
      vi.mocked(prisma.userCertification.findUnique).mockResolvedValue(
        mockCert as any
      );
      vi.mocked(prisma.userCertification.delete).mockResolvedValue(
        mockCert as any
      );

      const res = await DELETE(makeDelete(), idParams as any);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.ok).toBe(true);
    });

    it("returns 500 on database error", async () => {
      mockAuth();
      vi.mocked(prisma.userCertification.findUnique).mockResolvedValue(
        mockCert as any
      );
      vi.mocked(prisma.userCertification.delete).mockRejectedValue(
        new Error("DB error")
      );

      const res = await DELETE(makeDelete(), idParams as any);
      expect(res.status).toBe(500);
    });
  });
});
