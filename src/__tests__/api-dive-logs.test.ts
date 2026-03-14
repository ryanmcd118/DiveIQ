import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock next-auth (routes import from "next-auth", not "next-auth/next")
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

// Mock repositories
vi.mock("@/services/database/repositories/diveLogRepository", () => ({
  diveLogRepository: {
    findById: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    recomputeDiveNumbersForUser: vi.fn(),
  },
}));

vi.mock("@/services/database/repositories/gearRepository", () => ({
  diveGearRepository: {
    getGearForDive: vi.fn(),
    setGearForDive: vi.fn(),
  },
}));

// Mock authOptions to avoid importing the full auth config
vi.mock("@/features/auth/lib/auth", () => ({
  authOptions: {},
}));

import { GET, POST } from "@/app/api/dive-logs/route";
import { getServerSession } from "next-auth";
import { diveLogRepository } from "@/services/database/repositories/diveLogRepository";
import { diveGearRepository } from "@/services/database/repositories/gearRepository";

// ── Helpers ─────────────────────────────────────────────────────────────

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

function makeGet(params?: Record<string, string>): NextRequest {
  const url = new URL("http://localhost:3000/api/dive-logs");
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
  }
  return new NextRequest(url);
}

function makePost(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost:3000/api/dive-logs", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

const mockEntry = {
  id: "log-1",
  userId: USER_ID,
  date: "2026-03-01",
  siteName: "Coral Garden",
  maxDepthCm: 1829,
  bottomTime: 45,
};

const mockGearItem = {
  id: "dgi-1",
  diveId: "log-1",
  gearItemId: "gear-1",
  gearItem: {
    id: "gear-1",
    type: "WETSUIT",
    manufacturer: "O'Neill",
    model: "Reactor 3mm",
  },
};

// ── Tests ───────────────────────────────────────────────────────────────

describe("dive logs API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Auth guard ──────────────────────────────────────────────────────

  describe("auth guard", () => {
    it("GET returns 401 when unauthenticated", async () => {
      mockNoAuth();
      const res = await GET(makeGet());
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe("Unauthorized");
    });

    it("POST returns 401 when unauthenticated", async () => {
      mockNoAuth();
      const res = await POST(
        makePost({ action: "create", payload: { siteName: "Test" } })
      );
      expect(res.status).toBe(401);
    });
  });

  // ── GET ─────────────────────────────────────────────────────────────

  describe("GET /api/dive-logs", () => {
    beforeEach(() => {
      mockAuth();
    });

    it("returns all entries for authenticated user", async () => {
      vi.mocked(diveLogRepository.findMany).mockResolvedValue([
        mockEntry,
      ] as any);
      vi.mocked(diveGearRepository.getGearForDive).mockResolvedValue([]);

      const res = await GET(makeGet());
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.entries).toHaveLength(1);
      expect(data.entries[0].id).toBe("log-1");
      expect(data.entries[0].gearItems).toEqual([]);
    });

    it("returns entries with gear items attached", async () => {
      vi.mocked(diveLogRepository.findMany).mockResolvedValue([
        mockEntry,
      ] as any);
      vi.mocked(diveGearRepository.getGearForDive).mockResolvedValue([
        mockGearItem,
      ] as any);

      const res = await GET(makeGet());
      const data = await res.json();

      expect(data.entries[0].gearItems).toHaveLength(1);
      expect(data.entries[0].gearItems[0].type).toBe("WETSUIT");
    });

    it("returns empty array when user has no logs", async () => {
      vi.mocked(diveLogRepository.findMany).mockResolvedValue([]);

      const res = await GET(makeGet());
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.entries).toEqual([]);
    });

    it("fetches single entry by id query param", async () => {
      vi.mocked(diveLogRepository.findById).mockResolvedValue(mockEntry as any);
      vi.mocked(diveGearRepository.getGearForDive).mockResolvedValue([]);

      const res = await GET(makeGet({ id: "log-1" }));
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.entry).toBeDefined();
      expect(data.entry.id).toBe("log-1");
      expect(data.gearItems).toEqual([]);
    });

    it("returns null entry when id not found", async () => {
      vi.mocked(diveLogRepository.findById).mockResolvedValue(null);

      const res = await GET(makeGet({ id: "nonexistent" }));
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.entry).toBeNull();
    });

    it("passes userId to findMany for scoping", async () => {
      vi.mocked(diveLogRepository.findMany).mockResolvedValue([]);

      await GET(makeGet());

      expect(diveLogRepository.findMany).toHaveBeenCalledWith({
        orderBy: "date",
        userId: USER_ID,
      });
    });

    it("returns 500 on repository error", async () => {
      vi.mocked(diveLogRepository.findMany).mockRejectedValue(
        new Error("DB error")
      );

      const res = await GET(makeGet());
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toContain("Failed to fetch");
    });
  });

  // ── POST action: create ─────────────────────────────────────────────

  describe("POST action: create", () => {
    beforeEach(() => {
      mockAuth();
    });

    it("returns 400 when payload is missing", async () => {
      const res = await POST(makePost({ action: "create" }));
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain("Missing payload");
    });

    it("creates a dive log and returns it with gear", async () => {
      vi.mocked(diveLogRepository.create).mockResolvedValue(mockEntry as any);
      vi.mocked(diveLogRepository.findById).mockResolvedValue(mockEntry as any);
      vi.mocked(
        diveLogRepository.recomputeDiveNumbersForUser
      ).mockResolvedValue(undefined);
      vi.mocked(diveGearRepository.getGearForDive).mockResolvedValue([]);

      const res = await POST(
        makePost({
          action: "create",
          payload: { date: "2026-03-01", siteName: "Coral Garden" },
        })
      );
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.entry.id).toBe("log-1");
      expect(data.gearItems).toEqual([]);
    });

    it("calls recomputeDiveNumbersForUser after creation", async () => {
      vi.mocked(diveLogRepository.create).mockResolvedValue(mockEntry as any);
      vi.mocked(diveLogRepository.findById).mockResolvedValue(mockEntry as any);
      vi.mocked(
        diveLogRepository.recomputeDiveNumbersForUser
      ).mockResolvedValue(undefined);
      vi.mocked(diveGearRepository.getGearForDive).mockResolvedValue([]);

      await POST(
        makePost({
          action: "create",
          payload: { date: "2026-03-01", siteName: "Coral Garden" },
        })
      );

      expect(
        diveLogRepository.recomputeDiveNumbersForUser
      ).toHaveBeenCalledWith(USER_ID);
    });

    it("sets gear associations when gearItemIds are provided", async () => {
      vi.mocked(diveLogRepository.create).mockResolvedValue(mockEntry as any);
      vi.mocked(diveLogRepository.findById).mockResolvedValue(mockEntry as any);
      vi.mocked(
        diveLogRepository.recomputeDiveNumbersForUser
      ).mockResolvedValue(undefined);
      vi.mocked(diveGearRepository.setGearForDive).mockResolvedValue(undefined);
      vi.mocked(diveGearRepository.getGearForDive).mockResolvedValue([
        mockGearItem,
      ] as any);

      const res = await POST(
        makePost({
          action: "create",
          payload: {
            date: "2026-03-01",
            siteName: "Coral Garden",
            gearItemIds: ["gear-1", "gear-2"],
          },
        })
      );
      const data = await res.json();

      expect(diveGearRepository.setGearForDive).toHaveBeenCalledWith(
        "log-1",
        ["gear-1", "gear-2"],
        USER_ID
      );
      expect(data.gearItems).toHaveLength(1);
    });

    it("skips gear association when gearItemIds is empty", async () => {
      vi.mocked(diveLogRepository.create).mockResolvedValue(mockEntry as any);
      vi.mocked(diveLogRepository.findById).mockResolvedValue(mockEntry as any);
      vi.mocked(
        diveLogRepository.recomputeDiveNumbersForUser
      ).mockResolvedValue(undefined);
      vi.mocked(diveGearRepository.getGearForDive).mockResolvedValue([]);

      await POST(
        makePost({
          action: "create",
          payload: {
            date: "2026-03-01",
            siteName: "Coral Garden",
            gearItemIds: [],
          },
        })
      );

      expect(diveGearRepository.setGearForDive).not.toHaveBeenCalled();
    });

    it("passes userId to create", async () => {
      vi.mocked(diveLogRepository.create).mockResolvedValue(mockEntry as any);
      vi.mocked(diveLogRepository.findById).mockResolvedValue(mockEntry as any);
      vi.mocked(
        diveLogRepository.recomputeDiveNumbersForUser
      ).mockResolvedValue(undefined);
      vi.mocked(diveGearRepository.getGearForDive).mockResolvedValue([]);

      await POST(
        makePost({
          action: "create",
          payload: { date: "2026-03-01", siteName: "Test" },
        })
      );

      expect(diveLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ date: "2026-03-01", siteName: "Test" }),
        USER_ID
      );
    });
  });

  // ── POST action: update ─────────────────────────────────────────────

  describe("POST action: update", () => {
    beforeEach(() => {
      mockAuth();
    });

    it("returns 400 when id is missing", async () => {
      const res = await POST(
        makePost({
          action: "update",
          payload: { date: "2026-03-01", siteName: "Test" },
        })
      );
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain("Missing id");
    });

    it("returns 400 when payload is missing", async () => {
      const res = await POST(makePost({ action: "update", id: "log-1" }));
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain("Missing id or payload");
    });

    it("updates a dive log and returns it", async () => {
      const updatedEntry = { ...mockEntry, siteName: "Updated Reef" };
      vi.mocked(diveLogRepository.update).mockResolvedValue(
        updatedEntry as any
      );
      vi.mocked(diveLogRepository.findById).mockResolvedValue(
        updatedEntry as any
      );
      vi.mocked(
        diveLogRepository.recomputeDiveNumbersForUser
      ).mockResolvedValue(undefined);
      vi.mocked(diveGearRepository.getGearForDive).mockResolvedValue([]);

      const res = await POST(
        makePost({
          action: "update",
          id: "log-1",
          payload: { date: "2026-03-01", siteName: "Updated Reef" },
        })
      );
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.entry.siteName).toBe("Updated Reef");
    });

    it("calls recomputeDiveNumbersForUser after update", async () => {
      vi.mocked(diveLogRepository.update).mockResolvedValue(mockEntry as any);
      vi.mocked(diveLogRepository.findById).mockResolvedValue(mockEntry as any);
      vi.mocked(
        diveLogRepository.recomputeDiveNumbersForUser
      ).mockResolvedValue(undefined);
      vi.mocked(diveGearRepository.getGearForDive).mockResolvedValue([]);

      await POST(
        makePost({
          action: "update",
          id: "log-1",
          payload: { date: "2026-03-01", siteName: "Test" },
        })
      );

      expect(
        diveLogRepository.recomputeDiveNumbersForUser
      ).toHaveBeenCalledWith(USER_ID);
    });

    it("sets gear when gearItemIds is provided (even empty)", async () => {
      vi.mocked(diveLogRepository.update).mockResolvedValue(mockEntry as any);
      vi.mocked(diveLogRepository.findById).mockResolvedValue(mockEntry as any);
      vi.mocked(
        diveLogRepository.recomputeDiveNumbersForUser
      ).mockResolvedValue(undefined);
      vi.mocked(diveGearRepository.setGearForDive).mockResolvedValue(undefined);
      vi.mocked(diveGearRepository.getGearForDive).mockResolvedValue([]);

      await POST(
        makePost({
          action: "update",
          id: "log-1",
          payload: {
            date: "2026-03-01",
            siteName: "Test",
            gearItemIds: [],
          },
        })
      );

      // Update path calls setGearForDive even for empty array (to clear gear)
      expect(diveGearRepository.setGearForDive).toHaveBeenCalledWith(
        "log-1",
        [],
        USER_ID
      );
    });

    it("skips gear update when gearItemIds is undefined", async () => {
      vi.mocked(diveLogRepository.update).mockResolvedValue(mockEntry as any);
      vi.mocked(diveLogRepository.findById).mockResolvedValue(mockEntry as any);
      vi.mocked(
        diveLogRepository.recomputeDiveNumbersForUser
      ).mockResolvedValue(undefined);
      vi.mocked(diveGearRepository.getGearForDive).mockResolvedValue([]);

      await POST(
        makePost({
          action: "update",
          id: "log-1",
          payload: { date: "2026-03-01", siteName: "Test" },
        })
      );

      expect(diveGearRepository.setGearForDive).not.toHaveBeenCalled();
    });

    it("passes userId to update for ownership check", async () => {
      vi.mocked(diveLogRepository.update).mockResolvedValue(mockEntry as any);
      vi.mocked(diveLogRepository.findById).mockResolvedValue(mockEntry as any);
      vi.mocked(
        diveLogRepository.recomputeDiveNumbersForUser
      ).mockResolvedValue(undefined);
      vi.mocked(diveGearRepository.getGearForDive).mockResolvedValue([]);

      await POST(
        makePost({
          action: "update",
          id: "log-1",
          payload: { date: "2026-03-01", siteName: "Test" },
        })
      );

      expect(diveLogRepository.update).toHaveBeenCalledWith(
        "log-1",
        expect.any(Object),
        USER_ID
      );
    });
  });

  // ── POST action: delete ─────────────────────────────────────────────

  describe("POST action: delete", () => {
    beforeEach(() => {
      mockAuth();
    });

    it("returns 400 when id is missing", async () => {
      const res = await POST(makePost({ action: "delete" }));
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain("Missing id");
    });

    it("deletes the dive log and returns ok", async () => {
      vi.mocked(diveLogRepository.delete).mockResolvedValue(undefined);
      vi.mocked(
        diveLogRepository.recomputeDiveNumbersForUser
      ).mockResolvedValue(undefined);

      const res = await POST(makePost({ action: "delete", id: "log-1" }));
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.ok).toBe(true);
    });

    it("passes userId to delete for ownership check", async () => {
      vi.mocked(diveLogRepository.delete).mockResolvedValue(undefined);
      vi.mocked(
        diveLogRepository.recomputeDiveNumbersForUser
      ).mockResolvedValue(undefined);

      await POST(makePost({ action: "delete", id: "log-1" }));

      expect(diveLogRepository.delete).toHaveBeenCalledWith("log-1", USER_ID);
    });

    it("calls recomputeDiveNumbersForUser after deletion", async () => {
      vi.mocked(diveLogRepository.delete).mockResolvedValue(undefined);
      vi.mocked(
        diveLogRepository.recomputeDiveNumbersForUser
      ).mockResolvedValue(undefined);

      await POST(makePost({ action: "delete", id: "log-1" }));

      expect(
        diveLogRepository.recomputeDiveNumbersForUser
      ).toHaveBeenCalledWith(USER_ID);
    });
  });

  // ── POST: unknown action ────────────────────────────────────────────

  describe("POST: unknown action", () => {
    it("returns 400 for unrecognized action", async () => {
      mockAuth();

      const res = await POST(makePost({ action: "archive" }));
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain("Invalid action");
    });
  });

  // ── POST: error handling ────────────────────────────────────────────

  describe("POST: error handling", () => {
    beforeEach(() => {
      mockAuth();
    });

    it("returns 500 when create throws", async () => {
      vi.mocked(diveLogRepository.create).mockRejectedValue(
        new Error("DB error")
      );

      const res = await POST(
        makePost({
          action: "create",
          payload: { date: "2026-03-01", siteName: "Test" },
        })
      );
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toContain("Failed to process");
    });

    it("returns 500 when delete throws", async () => {
      vi.mocked(diveLogRepository.delete).mockRejectedValue(
        new Error("Not found")
      );

      const res = await POST(makePost({ action: "delete", id: "log-1" }));
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toContain("Failed to process");
    });
  });
});
