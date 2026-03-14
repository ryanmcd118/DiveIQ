import { describe, it, expect, vi, beforeEach } from "vitest";
import "./helpers/mockPrisma";
import { prisma } from "@/lib/prisma";
import { divePlanRepository } from "@/services/database/repositories/divePlanRepository";

const USER_ID = "user-123";
const OTHER_USER = "user-other";

const mockPlan = {
  id: "plan-1",
  userId: USER_ID,
  date: "2026-06-15",
  region: "Caribbean",
  siteName: "Coral Garden",
  maxDepthCm: 1829,
  bottomTime: 45,
  experienceLevel: "Intermediate",
  riskLevel: "Low",
  aiAdvice: "Test advice",
  aiBriefing: { keyConsiderations: ["test"] },
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockInput = {
  date: "2026-06-15",
  region: "Caribbean",
  siteName: "Coral Garden",
  maxDepthCm: 1829,
  bottomTime: 45,
  experienceLevel: "Intermediate",
  riskLevel: "Low",
  aiAdvice: "Test advice",
  aiBriefing: { keyConsiderations: ["test"] },
} as any;

describe("divePlanRepository", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("create", () => {
    it("passes userId to prisma.divePlan.create", async () => {
      vi.mocked(prisma.divePlan.create).mockResolvedValue(mockPlan as any);
      await divePlanRepository.create(mockInput, USER_ID);

      expect(prisma.divePlan.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: USER_ID }),
        })
      );
    });

    it("casts experienceLevel in return value", async () => {
      vi.mocked(prisma.divePlan.create).mockResolvedValue(mockPlan as any);
      const result = await divePlanRepository.create(mockInput, USER_ID);
      expect(result.experienceLevel).toBe("Intermediate");
    });
  });

  describe("findById", () => {
    it("scopes query by both id and userId in the WHERE clause", async () => {
      vi.mocked(prisma.divePlan.findFirst).mockResolvedValue(mockPlan as any);
      await divePlanRepository.findById("plan-1", USER_ID);

      expect(prisma.divePlan.findFirst).toHaveBeenCalledWith({
        where: { id: "plan-1", userId: USER_ID },
      });
    });

    it("returns plan when found for the user", async () => {
      vi.mocked(prisma.divePlan.findFirst).mockResolvedValue(mockPlan as any);
      const result = await divePlanRepository.findById("plan-1", USER_ID);
      expect(result).not.toBeNull();
      expect(result!.id).toBe("plan-1");
    });

    it("returns null when plan not found (wrong user or missing)", async () => {
      vi.mocked(prisma.divePlan.findFirst).mockResolvedValue(null);
      const result = await divePlanRepository.findById("plan-1", OTHER_USER);
      expect(result).toBeNull();
    });
  });

  describe("findMany", () => {
    it("always includes userId in where clause", async () => {
      vi.mocked(prisma.divePlan.findMany).mockResolvedValue([]);
      await divePlanRepository.findMany({ userId: USER_ID });

      const call = vi.mocked(prisma.divePlan.findMany).mock.calls[0][0];
      expect(call?.where).toEqual({ userId: USER_ID });
    });

    it("casts experienceLevel and aiBriefing for each result", async () => {
      vi.mocked(prisma.divePlan.findMany).mockResolvedValue([mockPlan] as any);
      const results = await divePlanRepository.findMany({ userId: USER_ID });

      expect(results[0].experienceLevel).toBe("Intermediate");
      expect(results[0].aiBriefing).toEqual({ keyConsiderations: ["test"] });
    });

    it("defaults to orderBy createdAt desc", async () => {
      vi.mocked(prisma.divePlan.findMany).mockResolvedValue([]);
      await divePlanRepository.findMany({ userId: USER_ID });

      const call = vi.mocked(prisma.divePlan.findMany).mock.calls[0][0];
      expect(call?.orderBy).toEqual({ createdAt: "desc" });
    });
  });

  describe("update", () => {
    it("scopes ownership check by id and userId via findFirst", async () => {
      vi.mocked(prisma.divePlan.findFirst).mockResolvedValue(mockPlan as any);
      vi.mocked(prisma.divePlan.update).mockResolvedValue(mockPlan as any);

      await divePlanRepository.update("plan-1", mockInput, USER_ID);

      expect(prisma.divePlan.findFirst).toHaveBeenCalledWith({
        where: { id: "plan-1", userId: USER_ID },
      });
    });

    it("throws when record not found", async () => {
      vi.mocked(prisma.divePlan.findFirst).mockResolvedValue(null);

      await expect(
        divePlanRepository.update("nonexistent", mockInput, USER_ID)
      ).rejects.toThrow("Dive plan not found or unauthorized");
    });

    it("throws when userId does not match", async () => {
      vi.mocked(prisma.divePlan.findFirst).mockResolvedValue(null);

      await expect(
        divePlanRepository.update("plan-1", mockInput, OTHER_USER)
      ).rejects.toThrow("Dive plan not found or unauthorized");
    });
  });

  describe("delete", () => {
    it("scopes ownership check by id and userId via findFirst", async () => {
      vi.mocked(prisma.divePlan.findFirst).mockResolvedValue(mockPlan as any);
      vi.mocked(prisma.divePlan.delete).mockResolvedValue(mockPlan as any);

      await divePlanRepository.delete("plan-1", USER_ID);

      expect(prisma.divePlan.findFirst).toHaveBeenCalledWith({
        where: { id: "plan-1", userId: USER_ID },
      });
    });

    it("throws when record not found", async () => {
      vi.mocked(prisma.divePlan.findFirst).mockResolvedValue(null);

      await expect(
        divePlanRepository.delete("nonexistent", USER_ID)
      ).rejects.toThrow("Dive plan not found or unauthorized");
    });

    it("throws when userId does not match", async () => {
      vi.mocked(prisma.divePlan.findFirst).mockResolvedValue(null);

      await expect(
        divePlanRepository.delete("plan-1", OTHER_USER)
      ).rejects.toThrow("Dive plan not found or unauthorized");
    });
  });

  describe("count", () => {
    it("scopes to userId", async () => {
      vi.mocked(prisma.divePlan.count).mockResolvedValue(3);
      await divePlanRepository.count(USER_ID);

      expect(prisma.divePlan.count).toHaveBeenCalledWith({
        where: { userId: USER_ID },
      });
    });
  });
});
