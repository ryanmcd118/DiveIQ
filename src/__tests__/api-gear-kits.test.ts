import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/features/auth/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/services/database/repositories/gearRepository", () => ({
  gearKitRepository: {
    findMany: vi.fn(),
    findById: vi.fn(),
    findDefault: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    setItems: vi.fn(),
    addItems: vi.fn(),
    removeItems: vi.fn(),
  },
}));

import { GET, POST, PUT, DELETE } from "@/app/api/gear-kits/route";
import { getServerSession } from "next-auth";
import { gearKitRepository } from "@/services/database/repositories/gearRepository";

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

const mockKit = {
  id: "kit-1",
  userId: USER_ID,
  name: "Tropical Kit",
  isDefault: false,
  kitItems: [],
};

function makeGet(): NextRequest {
  return new NextRequest("http://localhost:3000/api/gear-kits");
}
function makePost(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost:3000/api/gear-kits", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}
function makePut(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost:3000/api/gear-kits", {
    method: "PUT",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}
function makeDelete(id?: string): NextRequest {
  const url = new URL("http://localhost:3000/api/gear-kits");
  if (id) url.searchParams.set("id", id);
  return new NextRequest(url, { method: "DELETE" });
}

describe("gear kits API", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("auth guard", () => {
    beforeEach(() => mockNoAuth());
    it("GET 401", async () => {
      expect((await GET(makeGet())).status).toBe(401);
    });
    it("POST 401", async () => {
      expect(
        (await POST(makePost({ action: "create", name: "Kit" }))).status
      ).toBe(401);
    });
    it("PUT 401", async () => {
      expect((await PUT(makePut({ id: "1" }))).status).toBe(401);
    });
    it("DELETE 401", async () => {
      expect((await DELETE(makeDelete("1"))).status).toBe(401);
    });
  });

  describe("GET", () => {
    beforeEach(() => mockAuth());

    it("returns kits", async () => {
      vi.mocked(gearKitRepository.findMany).mockResolvedValue([mockKit] as any);
      const data = await (await GET(makeGet())).json();
      expect(data.kits).toHaveLength(1);
    });

    it("returns empty array", async () => {
      vi.mocked(gearKitRepository.findMany).mockResolvedValue([]);
      const data = await (await GET(makeGet())).json();
      expect(data.kits).toEqual([]);
    });

    it("500 on error", async () => {
      vi.mocked(gearKitRepository.findMany).mockRejectedValue(new Error("DB"));
      expect((await GET(makeGet())).status).toBe(500);
    });
  });

  describe("POST action: create", () => {
    beforeEach(() => mockAuth());

    it("returns 400 when name missing", async () => {
      expect((await POST(makePost({ action: "create" }))).status).toBe(400);
    });

    it("creates kit on happy path", async () => {
      vi.mocked(gearKitRepository.create).mockResolvedValue(mockKit as any);
      vi.mocked(gearKitRepository.findById).mockResolvedValue(mockKit as any);
      const data = await (
        await POST(makePost({ action: "create", name: "Tropical Kit" }))
      ).json();
      expect(data.kit).toBeDefined();
      expect(data.kit.name).toBe("Tropical Kit");
    });

    it("sets items when gearItemIds provided", async () => {
      vi.mocked(gearKitRepository.create).mockResolvedValue(mockKit as any);
      vi.mocked(gearKitRepository.setItems).mockResolvedValue(undefined);
      vi.mocked(gearKitRepository.findById).mockResolvedValue(mockKit as any);
      await POST(
        makePost({
          action: "create",
          name: "Kit",
          gearItemIds: ["g1", "g2"],
        })
      );
      expect(gearKitRepository.setItems).toHaveBeenCalledWith(
        "kit-1",
        ["g1", "g2"],
        USER_ID
      );
    });

    it("500 on error", async () => {
      vi.mocked(gearKitRepository.create).mockRejectedValue(new Error("DB"));
      expect(
        (await POST(makePost({ action: "create", name: "Kit" }))).status
      ).toBe(500);
    });
  });

  describe("POST action: updateItems", () => {
    beforeEach(() => mockAuth());

    it("returns 400 when id or gearItemIds missing", async () => {
      expect((await POST(makePost({ action: "updateItems" }))).status).toBe(
        400
      );
    });

    it("updates items on happy path", async () => {
      vi.mocked(gearKitRepository.setItems).mockResolvedValue(undefined);
      vi.mocked(gearKitRepository.findById).mockResolvedValue(mockKit as any);
      const data = await (
        await POST(
          makePost({ action: "updateItems", id: "kit-1", gearItemIds: ["g1"] })
        )
      ).json();
      expect(data.kit).toBeDefined();
    });
  });

  describe("POST unknown action", () => {
    it("returns 400", async () => {
      mockAuth();
      expect((await POST(makePost({ action: "nope" }))).status).toBe(400);
    });
  });

  describe("PUT", () => {
    beforeEach(() => mockAuth());

    it("returns 400 when id missing", async () => {
      expect((await PUT(makePut({}))).status).toBe(400);
    });

    it("returns 404 when not found", async () => {
      vi.mocked(gearKitRepository.update).mockRejectedValue(
        new Error("Kit not found")
      );
      expect((await PUT(makePut({ id: "x" }))).status).toBe(404);
    });

    it("updates kit on happy path", async () => {
      vi.mocked(gearKitRepository.update).mockResolvedValue(mockKit as any);
      vi.mocked(gearKitRepository.findById).mockResolvedValue(mockKit as any);
      const data = await (
        await PUT(makePut({ id: "kit-1", name: "Updated" }))
      ).json();
      expect(data.kit).toBeDefined();
    });

    it("500 on other error", async () => {
      vi.mocked(gearKitRepository.update).mockRejectedValue(new Error("DB"));
      expect((await PUT(makePut({ id: "kit-1" }))).status).toBe(500);
    });
  });

  describe("DELETE", () => {
    beforeEach(() => mockAuth());

    it("returns 400 when id missing", async () => {
      expect((await DELETE(makeDelete())).status).toBe(400);
    });

    it("returns 404 when not found", async () => {
      vi.mocked(gearKitRepository.delete).mockRejectedValue(
        new Error("Kit not found")
      );
      expect((await DELETE(makeDelete("x"))).status).toBe(404);
    });

    it("deletes on happy path", async () => {
      vi.mocked(gearKitRepository.delete).mockResolvedValue(undefined);
      const data = await (await DELETE(makeDelete("kit-1"))).json();
      expect(data.ok).toBe(true);
    });

    it("passes userId", async () => {
      vi.mocked(gearKitRepository.delete).mockResolvedValue(undefined);
      await DELETE(makeDelete("kit-1"));
      expect(gearKitRepository.delete).toHaveBeenCalledWith("kit-1", USER_ID);
    });

    it("500 on other error", async () => {
      vi.mocked(gearKitRepository.delete).mockRejectedValue(new Error("DB"));
      expect((await DELETE(makeDelete("kit-1"))).status).toBe(500);
    });
  });
});
