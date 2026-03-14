import { describe, it, expect, vi, beforeEach } from "vitest";
import "./helpers/mockPrisma";
import { prisma } from "@/lib/prisma";
import { diveLogRepository } from "@/services/database/repositories/diveLogRepository";

const USER_ID = "user-123";
const OTHER_USER = "user-other";

const mockEntry = {
  id: "log-1",
  userId: USER_ID,
  date: "2026-03-01",
  siteName: "Coral Garden",
  maxDepthCm: 1829,
  bottomTime: 45,
  diveNumberOverride: null,
};

const mockInput = {
  date: "2026-03-01",
  siteName: "Coral Garden",
} as any;

describe("diveLogRepository", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("create", () => {
    it("passes userId to prisma.diveLog.create", async () => {
      vi.mocked(prisma.diveLog.create).mockResolvedValue(mockEntry as any);
      await diveLogRepository.create(mockInput, USER_ID);

      expect(prisma.diveLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: USER_ID }),
        })
      );
    });

    it("returns the created record", async () => {
      vi.mocked(prisma.diveLog.create).mockResolvedValue(mockEntry as any);
      const result = await diveLogRepository.create(mockInput, USER_ID);
      expect(result.id).toBe("log-1");
    });
  });

  describe("findById", () => {
    it("returns entry when userId matches", async () => {
      vi.mocked(prisma.diveLog.findUnique).mockResolvedValue(mockEntry as any);
      const result = await diveLogRepository.findById("log-1", USER_ID);
      expect(result).not.toBeNull();
      expect(result!.id).toBe("log-1");
    });

    it("returns null when userId does not match (ownership enforcement)", async () => {
      vi.mocked(prisma.diveLog.findUnique).mockResolvedValue(mockEntry as any);
      const result = await diveLogRepository.findById("log-1", OTHER_USER);
      expect(result).toBeNull();
    });

    it("returns null when entry not found", async () => {
      vi.mocked(prisma.diveLog.findUnique).mockResolvedValue(null);
      const result = await diveLogRepository.findById("nonexistent", USER_ID);
      expect(result).toBeNull();
    });

    // SECURITY NOTE: findById fetches by id WITHOUT userId in where clause,
    // then checks ownership in application code. The record is loaded from DB
    // regardless of who owns it.
    it("queries by id only (not userId) — ownership checked after fetch", async () => {
      vi.mocked(prisma.diveLog.findUnique).mockResolvedValue(mockEntry as any);
      await diveLogRepository.findById("log-1", USER_ID);

      expect(prisma.diveLog.findUnique).toHaveBeenCalledWith({
        where: { id: "log-1" },
      });
    });
  });

  describe("findMany", () => {
    it("includes userId in where clause when provided", async () => {
      vi.mocked(prisma.diveLog.findMany).mockResolvedValue([]);
      await diveLogRepository.findMany({ userId: USER_ID });

      const call = vi.mocked(prisma.diveLog.findMany).mock.calls[0][0];
      expect(call?.where).toEqual({ userId: USER_ID });
    });

    // SECURITY FINDING: userId is optional — omitting it returns ALL users' data
    it("omits userId from where when not provided (returns all users)", async () => {
      vi.mocked(prisma.diveLog.findMany).mockResolvedValue([]);
      await diveLogRepository.findMany();

      const call = vi.mocked(prisma.diveLog.findMany).mock.calls[0][0];
      expect(call?.where).toEqual({});
    });

    it("uses default orderBy date desc", async () => {
      vi.mocked(prisma.diveLog.findMany).mockResolvedValue([]);
      await diveLogRepository.findMany({ userId: USER_ID });

      const call = vi.mocked(prisma.diveLog.findMany).mock.calls[0][0];
      expect(call?.orderBy).toEqual({ date: "desc" });
    });

    it("returns array of entries", async () => {
      vi.mocked(prisma.diveLog.findMany).mockResolvedValue([mockEntry] as any);
      const result = await diveLogRepository.findMany({ userId: USER_ID });
      expect(result).toHaveLength(1);
    });
  });

  describe("update", () => {
    it("checks ownership before updating when userId provided", async () => {
      vi.mocked(prisma.diveLog.findUnique).mockResolvedValue(mockEntry as any);
      vi.mocked(prisma.diveLog.update).mockResolvedValue(mockEntry as any);

      await diveLogRepository.update("log-1", mockInput, USER_ID);

      expect(prisma.diveLog.findUnique).toHaveBeenCalledWith({
        where: { id: "log-1" },
      });
    });

    it("throws when record not found", async () => {
      vi.mocked(prisma.diveLog.findUnique).mockResolvedValue(null);

      await expect(
        diveLogRepository.update("nonexistent", mockInput, USER_ID)
      ).rejects.toThrow("Dive log not found or unauthorized");
    });

    it("throws when userId does not match (ownership enforcement)", async () => {
      vi.mocked(prisma.diveLog.findUnique).mockResolvedValue(mockEntry as any);

      await expect(
        diveLogRepository.update("log-1", mockInput, OTHER_USER)
      ).rejects.toThrow("Dive log not found or unauthorized");
    });

    // SECURITY FINDING: userId is optional — omitting it skips ownership check
    it("skips ownership check when userId is not provided", async () => {
      vi.mocked(prisma.diveLog.update).mockResolvedValue(mockEntry as any);

      await diveLogRepository.update("log-1", mockInput);

      expect(prisma.diveLog.findUnique).not.toHaveBeenCalled();
      expect(prisma.diveLog.update).toHaveBeenCalled();
    });
  });

  describe("delete", () => {
    it("checks ownership before deleting when userId provided", async () => {
      vi.mocked(prisma.diveLog.findUnique).mockResolvedValue(mockEntry as any);
      vi.mocked(prisma.diveLog.delete).mockResolvedValue(mockEntry as any);

      await diveLogRepository.delete("log-1", USER_ID);

      expect(prisma.diveLog.findUnique).toHaveBeenCalledWith({
        where: { id: "log-1" },
      });
      expect(prisma.diveLog.delete).toHaveBeenCalledWith({
        where: { id: "log-1" },
      });
    });

    it("throws when record not found", async () => {
      vi.mocked(prisma.diveLog.findUnique).mockResolvedValue(null);

      await expect(
        diveLogRepository.delete("nonexistent", USER_ID)
      ).rejects.toThrow("Dive log not found or unauthorized");
    });

    it("throws when userId does not match", async () => {
      vi.mocked(prisma.diveLog.findUnique).mockResolvedValue(mockEntry as any);

      await expect(
        diveLogRepository.delete("log-1", OTHER_USER)
      ).rejects.toThrow("Dive log not found or unauthorized");
    });
  });

  describe("recomputeDiveNumbersForUser", () => {
    it("fetches dives ordered by date asc for specific userId", async () => {
      vi.mocked(prisma.diveLog.findMany).mockResolvedValue([]);

      await diveLogRepository.recomputeDiveNumbersForUser(USER_ID);

      expect(prisma.diveLog.findMany).toHaveBeenCalledWith({
        where: { userId: USER_ID },
        orderBy: [
          { date: "asc" },
          { startTime: "asc" },
          { createdAt: "asc" },
          { id: "asc" },
        ],
      });
    });

    it("does nothing when user has no dives", async () => {
      vi.mocked(prisma.diveLog.findMany).mockResolvedValue([]);

      await diveLogRepository.recomputeDiveNumbersForUser(USER_ID);

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("assigns auto numbers starting from 1", async () => {
      const dives = [
        { id: "a", diveNumberOverride: null },
        { id: "b", diveNumberOverride: null },
        { id: "c", diveNumberOverride: 99 },
      ];
      vi.mocked(prisma.diveLog.findMany).mockResolvedValue(dives as any);
      vi.mocked(prisma.diveLog.update).mockReturnValue({} as any);
      (prisma.$transaction as any).mockResolvedValue([]);

      await diveLogRepository.recomputeDiveNumbersForUser(USER_ID);

      // $transaction called with array of update promises
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      // Verify the update calls were constructed correctly
      const txArg = (prisma.$transaction as any).mock.calls[0][0];
      expect(Array.isArray(txArg)).toBe(true);
      // 3 dives = 3 update calls
      expect(txArg.length).toBe(3);
    });

    it("uses override when present, auto number otherwise", async () => {
      const dives = [
        { id: "a", diveNumberOverride: null },
        { id: "b", diveNumberOverride: 42 },
      ];
      vi.mocked(prisma.diveLog.findMany).mockResolvedValue(dives as any);

      // Capture the update calls
      const updateCalls: any[] = [];
      (prisma.diveLog.update as any).mockImplementation((...args: any[]) => {
        updateCalls.push(args[0]);
        return {} as any;
      });
      (prisma.$transaction as any).mockResolvedValue([]);

      await diveLogRepository.recomputeDiveNumbersForUser(USER_ID);

      // Verify update was called with correct data for each dive
      expect(updateCalls[0]).toEqual({
        where: { id: "a" },
        data: { diveNumberAuto: 1, diveNumber: 1 }, // no override → auto
      });
      expect(updateCalls[1]).toEqual({
        where: { id: "b" },
        data: { diveNumberAuto: 2, diveNumber: 42 }, // override 42 takes precedence
      });
    });
  });

  describe("getStatistics", () => {
    it("scopes queries to userId when provided", async () => {
      vi.mocked(prisma.diveLog.count).mockResolvedValue(5);
      vi.mocked(prisma.diveLog.aggregate).mockResolvedValue({
        _sum: { bottomTime: 200 },
        _max: { maxDepthCm: 3000 },
      } as any);

      await diveLogRepository.getStatistics(USER_ID);

      expect(prisma.diveLog.count).toHaveBeenCalledWith({
        where: { userId: USER_ID },
      });
      expect(prisma.diveLog.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: USER_ID },
        })
      );
    });

    it("returns correct aggregated shape", async () => {
      vi.mocked(prisma.diveLog.count).mockResolvedValue(10);
      vi.mocked(prisma.diveLog.aggregate).mockResolvedValue({
        _sum: { bottomTime: 500 },
        _max: { maxDepthCm: 4000 },
      } as any);

      const result = await diveLogRepository.getStatistics(USER_ID);

      expect(result).toEqual({
        totalDives: 10,
        totalBottomTime: 500,
        deepestDive: 4000,
      });
    });

    it("defaults to 0 for null aggregates", async () => {
      vi.mocked(prisma.diveLog.count).mockResolvedValue(0);
      vi.mocked(prisma.diveLog.aggregate).mockResolvedValue({
        _sum: { bottomTime: null },
        _max: { maxDepthCm: null },
      } as any);

      const result = await diveLogRepository.getStatistics(USER_ID);

      expect(result.totalBottomTime).toBe(0);
      expect(result.deepestDive).toBe(0);
    });
  });

  describe("count", () => {
    it("scopes to userId when provided", async () => {
      vi.mocked(prisma.diveLog.count).mockResolvedValue(5);
      await diveLogRepository.count(USER_ID);

      expect(prisma.diveLog.count).toHaveBeenCalledWith({
        where: { userId: USER_ID },
      });
    });
  });
});
