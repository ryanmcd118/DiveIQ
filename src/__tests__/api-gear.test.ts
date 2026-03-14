import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/features/auth/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/services/database/repositories/gearRepository", () => ({
  gearRepository: {
    findMany: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    setActive: vi.fn(),
  },
}));

import { GET, POST, PUT, DELETE } from "@/app/api/gear/route";
import { getServerSession } from "next-auth";
import { gearRepository } from "@/services/database/repositories/gearRepository";

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

const mockItem = {
  id: "gear-1",
  userId: USER_ID,
  type: "WETSUIT",
  manufacturer: "O'Neill",
  model: "Reactor 3mm",
  isActive: true,
};

function makeGet(params?: Record<string, string>): NextRequest {
  const url = new URL("http://localhost:3000/api/gear");
  if (params)
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return new NextRequest(url);
}
function makePost(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost:3000/api/gear", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}
function makePut(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost:3000/api/gear", {
    method: "PUT",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}
function makeDelete(id?: string): NextRequest {
  const url = new URL("http://localhost:3000/api/gear");
  if (id) url.searchParams.set("id", id);
  return new NextRequest(url, { method: "DELETE" });
}

describe("gear API", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("auth guard", () => {
    it("GET returns 401", async () => {
      mockNoAuth();
      expect((await GET(makeGet())).status).toBe(401);
    });
    it("POST returns 401", async () => {
      mockNoAuth();
      expect((await POST(makePost({ type: "WETSUIT" }))).status).toBe(401);
    });
    it("PUT returns 401", async () => {
      mockNoAuth();
      expect((await PUT(makePut({ id: "1" }))).status).toBe(401);
    });
    it("DELETE returns 401", async () => {
      mockNoAuth();
      expect((await DELETE(makeDelete("1"))).status).toBe(401);
    });
  });

  describe("GET /api/gear", () => {
    beforeEach(() => mockAuth());

    it("returns gear items", async () => {
      vi.mocked(gearRepository.findMany).mockResolvedValue([mockItem] as any);
      const data = await (await GET(makeGet())).json();
      expect(data.items).toHaveLength(1);
      expect(data.items[0].type).toBe("WETSUIT");
    });

    it("returns empty array", async () => {
      vi.mocked(gearRepository.findMany).mockResolvedValue([]);
      const data = await (await GET(makeGet())).json();
      expect(data.items).toEqual([]);
    });

    it("passes query params to repository", async () => {
      vi.mocked(gearRepository.findMany).mockResolvedValue([]);
      await GET(makeGet({ includeInactive: "true", type: "MASK" }));
      expect(gearRepository.findMany).toHaveBeenCalledWith(USER_ID, {
        includeInactive: true,
        type: "MASK",
      });
    });

    it("returns 500 on error", async () => {
      vi.mocked(gearRepository.findMany).mockRejectedValue(new Error("DB"));
      expect((await GET(makeGet())).status).toBe(500);
    });
  });

  describe("POST /api/gear", () => {
    beforeEach(() => mockAuth());

    it("returns 400 when required fields missing", async () => {
      const res = await POST(makePost({ type: "WETSUIT" }));
      expect(res.status).toBe(400);
    });

    it("creates item on happy path", async () => {
      vi.mocked(gearRepository.create).mockResolvedValue(mockItem as any);
      const res = await POST(
        makePost({ type: "WETSUIT", manufacturer: "O'Neill", model: "3mm" })
      );
      const data = await res.json();
      expect(res.status).toBe(201);
      expect(data.item.type).toBe("WETSUIT");
    });

    it("passes userId to create", async () => {
      vi.mocked(gearRepository.create).mockResolvedValue(mockItem as any);
      await POST(
        makePost({ type: "WETSUIT", manufacturer: "O'Neill", model: "3mm" })
      );
      expect(gearRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: USER_ID }),
        USER_ID
      );
    });

    it("returns 500 on error", async () => {
      vi.mocked(gearRepository.create).mockRejectedValue(new Error("DB"));
      const res = await POST(
        makePost({ type: "WETSUIT", manufacturer: "O'Neill", model: "3mm" })
      );
      expect(res.status).toBe(500);
    });
  });

  describe("PUT /api/gear", () => {
    beforeEach(() => mockAuth());

    it("returns 400 when id missing", async () => {
      expect((await PUT(makePut({}))).status).toBe(400);
    });

    it("returns 404 when not found", async () => {
      vi.mocked(gearRepository.update).mockRejectedValue(
        new Error("Gear item not found")
      );
      expect((await PUT(makePut({ id: "x" }))).status).toBe(404);
    });

    it("updates item on happy path", async () => {
      vi.mocked(gearRepository.update).mockResolvedValue(mockItem as any);
      const data = await (
        await PUT(makePut({ id: "gear-1", type: "BCD" }))
      ).json();
      expect(data.item).toBeDefined();
    });

    it("returns 500 on other error", async () => {
      vi.mocked(gearRepository.update).mockRejectedValue(new Error("DB"));
      expect((await PUT(makePut({ id: "gear-1" }))).status).toBe(500);
    });
  });

  describe("DELETE /api/gear", () => {
    beforeEach(() => mockAuth());

    it("returns 400 when id missing", async () => {
      expect((await DELETE(makeDelete())).status).toBe(400);
    });

    it("returns 404 when not found", async () => {
      vi.mocked(gearRepository.delete).mockRejectedValue(
        new Error("Gear item not found")
      );
      expect((await DELETE(makeDelete("x"))).status).toBe(404);
    });

    it("deletes on happy path", async () => {
      vi.mocked(gearRepository.delete).mockResolvedValue(undefined);
      const data = await (await DELETE(makeDelete("gear-1"))).json();
      expect(data.ok).toBe(true);
    });

    it("passes userId for ownership", async () => {
      vi.mocked(gearRepository.delete).mockResolvedValue(undefined);
      await DELETE(makeDelete("gear-1"));
      expect(gearRepository.delete).toHaveBeenCalledWith("gear-1", USER_ID);
    });

    it("returns 500 on other error", async () => {
      vi.mocked(gearRepository.delete).mockRejectedValue(new Error("DB"));
      expect((await DELETE(makeDelete("gear-1"))).status).toBe(500);
    });
  });
});
