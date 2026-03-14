import { describe, it, expect, vi, beforeEach } from "vitest";
import "./helpers/mockPrisma";
import { prisma } from "@/lib/prisma";
import {
  gearRepository,
  gearKitRepository,
  diveGearRepository,
} from "@/services/database/repositories/gearRepository";

const USER_ID = "user-123";
const OTHER_USER = "user-other";

const mockItem = {
  id: "gear-1",
  userId: USER_ID,
  type: "WETSUIT",
  manufacturer: "O'Neill",
  model: "3mm",
  isActive: true,
};

const mockKit = {
  id: "kit-1",
  userId: USER_ID,
  name: "Tropical",
  isDefault: false,
};

// ── gearRepository ────────────────────────────────────────────────────

describe("gearRepository", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("create", () => {
    it("throws when data.userId does not match userId param", async () => {
      await expect(
        gearRepository.create(
          {
            userId: OTHER_USER,
            type: "WETSUIT",
            manufacturer: "X",
            model: "Y",
          },
          USER_ID
        )
      ).rejects.toThrow("Unauthorized");
    });

    it("creates item when userId matches", async () => {
      vi.mocked(prisma.gearItem.create).mockResolvedValue(mockItem as any);
      const result = await gearRepository.create(
        {
          userId: USER_ID,
          type: "WETSUIT",
          manufacturer: "O'Neill",
          model: "3mm",
        },
        USER_ID
      );
      expect(result.id).toBe("gear-1");
    });
  });

  describe("findMany", () => {
    it("always includes userId in where clause", async () => {
      vi.mocked(prisma.gearItem.findMany).mockResolvedValue([]);
      await gearRepository.findMany(USER_ID);

      const call = vi.mocked(prisma.gearItem.findMany).mock.calls[0][0];
      expect(call?.where).toEqual(expect.objectContaining({ userId: USER_ID }));
    });

    it("filters active by default", async () => {
      vi.mocked(prisma.gearItem.findMany).mockResolvedValue([]);
      await gearRepository.findMany(USER_ID);

      const call = vi.mocked(prisma.gearItem.findMany).mock.calls[0][0];
      expect(call?.where).toEqual(expect.objectContaining({ isActive: true }));
    });

    it("includes inactive when requested", async () => {
      vi.mocked(prisma.gearItem.findMany).mockResolvedValue([]);
      await gearRepository.findMany(USER_ID, { includeInactive: true });

      const call = vi.mocked(prisma.gearItem.findMany).mock.calls[0][0];
      expect(call?.where).not.toHaveProperty("isActive");
    });

    it("filters by type when provided", async () => {
      vi.mocked(prisma.gearItem.findMany).mockResolvedValue([]);
      await gearRepository.findMany(USER_ID, { type: "MASK" });

      const call = vi.mocked(prisma.gearItem.findMany).mock.calls[0][0];
      expect(call?.where).toEqual(expect.objectContaining({ type: "MASK" }));
    });
  });

  describe("findById", () => {
    it("queries with both id AND userId (proper scoping)", async () => {
      vi.mocked(prisma.gearItem.findFirst).mockResolvedValue(mockItem as any);
      await gearRepository.findById("gear-1", USER_ID);

      expect(prisma.gearItem.findFirst).toHaveBeenCalledWith({
        where: { id: "gear-1", userId: USER_ID },
      });
    });
  });

  describe("update", () => {
    it("verifies ownership via findFirst with userId", async () => {
      vi.mocked(prisma.gearItem.findFirst).mockResolvedValue(mockItem as any);
      vi.mocked(prisma.gearItem.update).mockResolvedValue(mockItem as any);
      await gearRepository.update("gear-1", { type: "BCD" }, USER_ID);

      expect(prisma.gearItem.findFirst).toHaveBeenCalledWith({
        where: { id: "gear-1", userId: USER_ID },
      });
    });

    it("throws when item not found (wrong user or nonexistent)", async () => {
      vi.mocked(prisma.gearItem.findFirst).mockResolvedValue(null);

      await expect(
        gearRepository.update("gear-1", { type: "BCD" }, USER_ID)
      ).rejects.toThrow("Gear item not found");
    });
  });

  describe("delete", () => {
    it("verifies ownership via findFirst with userId", async () => {
      vi.mocked(prisma.gearItem.findFirst).mockResolvedValue(mockItem as any);
      vi.mocked(prisma.gearItem.delete).mockResolvedValue(mockItem as any);
      await gearRepository.delete("gear-1", USER_ID);

      expect(prisma.gearItem.findFirst).toHaveBeenCalledWith({
        where: { id: "gear-1", userId: USER_ID },
      });
    });

    it("throws when item not found", async () => {
      vi.mocked(prisma.gearItem.findFirst).mockResolvedValue(null);

      await expect(gearRepository.delete("gear-1", USER_ID)).rejects.toThrow(
        "Gear item not found"
      );
    });
  });

  describe("setActive", () => {
    it("delegates to update with isActive field", async () => {
      vi.mocked(prisma.gearItem.findFirst).mockResolvedValue(mockItem as any);
      vi.mocked(prisma.gearItem.update).mockResolvedValue({
        ...mockItem,
        isActive: false,
      } as any);

      await gearRepository.setActive("gear-1", false, USER_ID);

      expect(prisma.gearItem.update).toHaveBeenCalledWith({
        where: { id: "gear-1" },
        data: { isActive: false },
      });
    });
  });
});

// ── gearKitRepository ─────────────────────────────────────────────────

describe("gearKitRepository", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("create", () => {
    it("throws when data.userId does not match userId param", async () => {
      await expect(
        gearKitRepository.create({ userId: OTHER_USER, name: "Kit" }, USER_ID)
      ).rejects.toThrow("Unauthorized");
    });

    it("creates kit via transaction", async () => {
      vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
        if (typeof fn === "function") {
          return fn({
            gearKit: {
              updateMany: vi.fn(),
              create: vi.fn().mockResolvedValue(mockKit),
            },
          } as any);
        }
        return undefined;
      });

      const result = await gearKitRepository.create(
        { userId: USER_ID, name: "Tropical" },
        USER_ID
      );
      expect(result.name).toBe("Tropical");
    });
  });

  describe("findMany", () => {
    it("scopes to userId", async () => {
      vi.mocked(prisma.gearKit.findMany).mockResolvedValue([]);
      await gearKitRepository.findMany(USER_ID);

      expect(prisma.gearKit.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: USER_ID },
        })
      );
    });
  });

  describe("findDefault", () => {
    it("scopes to userId and isDefault", async () => {
      vi.mocked(prisma.gearKit.findFirst).mockResolvedValue(null);
      await gearKitRepository.findDefault(USER_ID);

      expect(prisma.gearKit.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: USER_ID, isDefault: true },
        })
      );
    });
  });

  describe("findById", () => {
    it("queries with both id AND userId (proper scoping)", async () => {
      vi.mocked(prisma.gearKit.findFirst).mockResolvedValue(mockKit as any);
      await gearKitRepository.findById("kit-1", USER_ID);

      expect(prisma.gearKit.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "kit-1", userId: USER_ID },
        })
      );
    });
  });

  describe("update", () => {
    it("verifies ownership before updating", async () => {
      vi.mocked(prisma.gearKit.findFirst).mockResolvedValue(mockKit as any);
      vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
        if (typeof fn === "function") {
          return fn({
            gearKit: {
              updateMany: vi.fn(),
              update: vi.fn().mockResolvedValue(mockKit),
            },
          } as any);
        }
        return undefined;
      });

      await gearKitRepository.update("kit-1", { name: "Updated" }, USER_ID);

      expect(prisma.gearKit.findFirst).toHaveBeenCalledWith({
        where: { id: "kit-1", userId: USER_ID },
      });
    });

    it("throws when kit not found", async () => {
      vi.mocked(prisma.gearKit.findFirst).mockResolvedValue(null);

      await expect(
        gearKitRepository.update("kit-1", { name: "X" }, USER_ID)
      ).rejects.toThrow("Kit not found");
    });
  });

  describe("delete", () => {
    it("verifies ownership before deleting", async () => {
      vi.mocked(prisma.gearKit.findFirst).mockResolvedValue(mockKit as any);
      vi.mocked(prisma.gearKit.delete).mockResolvedValue(mockKit as any);

      await gearKitRepository.delete("kit-1", USER_ID);

      expect(prisma.gearKit.findFirst).toHaveBeenCalledWith({
        where: { id: "kit-1", userId: USER_ID },
      });
    });

    it("throws when kit not found", async () => {
      vi.mocked(prisma.gearKit.findFirst).mockResolvedValue(null);

      await expect(gearKitRepository.delete("kit-1", USER_ID)).rejects.toThrow(
        "Kit not found"
      );
    });
  });

  describe("addItems", () => {
    it("verifies kit ownership before adding items", async () => {
      vi.mocked(prisma.gearKit.findFirst).mockResolvedValue(mockKit as any);
      vi.mocked(prisma.gearItem.findMany).mockResolvedValue([mockItem] as any);
      vi.mocked(prisma.gearKitItem.findMany).mockResolvedValue([]);
      vi.mocked(prisma.gearKitItem.createMany).mockResolvedValue({ count: 1 });

      await gearKitRepository.addItems("kit-1", ["gear-1"], USER_ID);

      expect(prisma.gearKit.findFirst).toHaveBeenCalledWith({
        where: { id: "kit-1", userId: USER_ID },
      });
    });

    it("verifies gear items belong to user", async () => {
      vi.mocked(prisma.gearKit.findFirst).mockResolvedValue(mockKit as any);
      vi.mocked(prisma.gearItem.findMany).mockResolvedValue([mockItem] as any);
      vi.mocked(prisma.gearKitItem.findMany).mockResolvedValue([]);
      vi.mocked(prisma.gearKitItem.createMany).mockResolvedValue({ count: 1 });

      await gearKitRepository.addItems("kit-1", ["gear-1"], USER_ID);

      expect(prisma.gearItem.findMany).toHaveBeenCalledWith({
        where: { id: { in: ["gear-1"] }, userId: USER_ID },
      });
    });

    it("throws when gear items count mismatch (unauthorized items)", async () => {
      vi.mocked(prisma.gearKit.findFirst).mockResolvedValue(mockKit as any);
      vi.mocked(prisma.gearItem.findMany).mockResolvedValue([]); // 0 found but 1 requested
      vi.mocked(prisma.gearKitItem.findMany).mockResolvedValue([]);

      await expect(
        gearKitRepository.addItems("kit-1", ["gear-1"], USER_ID)
      ).rejects.toThrow("Some gear items not found or unauthorized");
    });

    it("throws when kit not found", async () => {
      vi.mocked(prisma.gearKit.findFirst).mockResolvedValue(null);

      await expect(
        gearKitRepository.addItems("kit-1", ["gear-1"], USER_ID)
      ).rejects.toThrow("Kit not found");
    });
  });

  describe("removeItems", () => {
    it("verifies kit ownership before removing", async () => {
      vi.mocked(prisma.gearKit.findFirst).mockResolvedValue(mockKit as any);
      vi.mocked(prisma.gearKitItem.deleteMany).mockResolvedValue({ count: 1 });

      await gearKitRepository.removeItems("kit-1", ["gear-1"], USER_ID);

      expect(prisma.gearKit.findFirst).toHaveBeenCalledWith({
        where: { id: "kit-1", userId: USER_ID },
      });
    });

    it("throws when kit not found", async () => {
      vi.mocked(prisma.gearKit.findFirst).mockResolvedValue(null);

      await expect(
        gearKitRepository.removeItems("kit-1", ["gear-1"], USER_ID)
      ).rejects.toThrow("Kit not found");
    });
  });

  describe("setItems", () => {
    it("verifies kit ownership before replacing items", async () => {
      vi.mocked(prisma.gearKit.findFirst).mockResolvedValue(mockKit as any);
      vi.mocked(prisma.$transaction).mockResolvedValue(undefined);

      await gearKitRepository.setItems("kit-1", [], USER_ID);

      expect(prisma.gearKit.findFirst).toHaveBeenCalledWith({
        where: { id: "kit-1", userId: USER_ID },
      });
    });

    it("throws when kit not found", async () => {
      vi.mocked(prisma.gearKit.findFirst).mockResolvedValue(null);

      await expect(
        gearKitRepository.setItems("kit-1", ["gear-1"], USER_ID)
      ).rejects.toThrow("Kit not found");
    });
  });
});

// ── diveGearRepository ────────────────────────────────────────────────

describe("diveGearRepository", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("getGearForDive", () => {
    it("verifies dive ownership with userId", async () => {
      vi.mocked(prisma.diveLog.findFirst).mockResolvedValue({
        id: "log-1",
        userId: USER_ID,
      } as any);
      vi.mocked(prisma.diveGearItem.findMany).mockResolvedValue([]);

      await diveGearRepository.getGearForDive("log-1", USER_ID);

      expect(prisma.diveLog.findFirst).toHaveBeenCalledWith({
        where: { id: "log-1", userId: USER_ID },
      });
    });

    it("throws when dive not found or not owned", async () => {
      vi.mocked(prisma.diveLog.findFirst).mockResolvedValue(null);

      await expect(
        diveGearRepository.getGearForDive("log-1", USER_ID)
      ).rejects.toThrow("Dive not found");
    });
  });

  describe("setGearForDive", () => {
    it("verifies dive ownership with userId", async () => {
      vi.mocked(prisma.diveLog.findFirst).mockResolvedValue({
        id: "log-1",
        userId: USER_ID,
      } as any);
      vi.mocked(prisma.$transaction).mockResolvedValue(undefined);

      await diveGearRepository.setGearForDive("log-1", [], USER_ID);

      expect(prisma.diveLog.findFirst).toHaveBeenCalledWith({
        where: { id: "log-1", userId: USER_ID },
      });
    });

    it("throws when dive not found or not owned", async () => {
      vi.mocked(prisma.diveLog.findFirst).mockResolvedValue(null);

      await expect(
        diveGearRepository.setGearForDive("log-1", ["g1"], USER_ID)
      ).rejects.toThrow("Dive not found");
    });
  });
});
