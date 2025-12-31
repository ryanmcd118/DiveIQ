import { prisma } from "@/lib/prisma";
import type { GearItem, GearKit, GearKitItem, DiveGearItem } from "@prisma/client";
import type { Prisma } from "@prisma/client";

export type GearItemWithRelations = GearItem & {
  kitItems?: GearKitItem[];
  diveGearItems?: DiveGearItem[];
};

export type GearKitWithItems = GearKit & {
  kitItems: (GearKitItem & {
    gearItem: GearItem;
  })[];
};

export type DiveGearItemWithGear = DiveGearItem & {
  gearItem: GearItem;
};

/**
 * Data access layer for GearItem operations
 */
export const gearRepository = {
  /**
   * Create a new gear item
   */
  async create(
    data: {
      userId: string;
      type: string;
      manufacturer: string;
      model: string;
      nickname?: string | null;
      purchaseDate?: Date | null;
      notes?: string | null;
      isActive?: boolean;
      lastServicedAt?: Date | null;
      serviceIntervalMonths?: number | null;
    },
    userId: string
  ): Promise<GearItem> {
    if (data.userId !== userId) {
      throw new Error("Unauthorized");
    }
    return prisma.gearItem.create({
      data,
    });
  },

  /**
   * Find gear items for a user
   */
  async findMany(
    userId: string,
    options?: {
      includeInactive?: boolean;
      type?: string;
    }
  ): Promise<GearItem[]> {
    const where: Prisma.GearItemWhereInput = {
      userId,
    };

    if (!options?.includeInactive) {
      where.isActive = true;
    }

    if (options?.type) {
      where.type = options.type;
    }

    return prisma.gearItem.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  /**
   * Find a single gear item by ID (with user check)
   */
  async findById(id: string, userId: string): Promise<GearItem | null> {
    return prisma.gearItem.findFirst({
      where: {
        id,
        userId,
      },
    });
  },

  /**
   * Update a gear item
   */
  async update(
    id: string,
    data: Partial<{
      type: string;
      manufacturer: string;
      model: string;
      nickname: string | null;
      purchaseDate: Date | null;
      notes: string | null;
      isActive: boolean;
      lastServicedAt: Date | null;
      serviceIntervalMonths: number | null;
    }>,
    userId: string
  ): Promise<GearItem> {
    // Verify ownership
    const existing = await prisma.gearItem.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new Error("Gear item not found");
    }

    return prisma.gearItem.update({
      where: { id },
      data,
    });
  },

  /**
   * Delete a gear item
   */
  async delete(id: string, userId: string): Promise<void> {
    const existing = await prisma.gearItem.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new Error("Gear item not found");
    }

    await prisma.gearItem.delete({
      where: { id },
    });
  },

  /**
   * Archive/unarchive a gear item
   */
  async setActive(id: string, isActive: boolean, userId: string): Promise<GearItem> {
    return this.update(id, { isActive }, userId);
  },
};

/**
 * Data access layer for GearKit operations
 */
export const gearKitRepository = {
  /**
   * Create a new gear kit
   */
  async create(
    data: {
      userId: string;
      name: string;
      isDefault?: boolean;
    },
    userId: string
  ): Promise<GearKit> {
    if (data.userId !== userId) {
      throw new Error("Unauthorized");
    }

    return prisma.$transaction(async (tx) => {
      // If setting as default, unset other defaults
      if (data.isDefault) {
        await tx.gearKit.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.gearKit.create({
        data,
      });
    });
  },

  /**
   * Find all kits for a user
   */
  async findMany(userId: string): Promise<GearKitWithItems[]> {
    return prisma.gearKit.findMany({
      where: { userId },
      include: {
        kitItems: {
          include: {
            gearItem: true,
          },
        },
      },
      orderBy: [
        { isDefault: "desc" },
        { createdAt: "desc" },
      ],
    });
  },

  /**
   * Find default kit for a user
   */
  async findDefault(userId: string): Promise<GearKitWithItems | null> {
    return prisma.gearKit.findFirst({
      where: {
        userId,
        isDefault: true,
      },
      include: {
        kitItems: {
          include: {
            gearItem: true,
          },
        },
      },
    });
  },

  /**
   * Find a kit by ID (with user check)
   */
  async findById(id: string, userId: string): Promise<GearKitWithItems | null> {
    return prisma.gearKit.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        kitItems: {
          include: {
            gearItem: true,
          },
        },
      },
    });
  },

  /**
   * Update a kit
   */
  async update(
    id: string,
    data: Partial<{
      name: string;
      isDefault: boolean;
    }>,
    userId: string
  ): Promise<GearKit> {
    const existing = await prisma.gearKit.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new Error("Kit not found");
    }

    return prisma.$transaction(async (tx) => {
      // If setting as default, unset other defaults
      if (data.isDefault) {
        await tx.gearKit.updateMany({
          where: {
            userId,
            isDefault: true,
            id: { not: id },
          },
          data: { isDefault: false },
        });
      }

      return tx.gearKit.update({
        where: { id },
        data,
      });
    });
  },

  /**
   * Delete a kit
   */
  async delete(id: string, userId: string): Promise<void> {
    const existing = await prisma.gearKit.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new Error("Kit not found");
    }

    await prisma.gearKit.delete({
      where: { id },
    });
  },

  /**
   * Add gear items to a kit
   */
  async addItems(
    kitId: string,
    gearItemIds: string[],
    userId: string
  ): Promise<void> {
    const kit = await prisma.gearKit.findFirst({
      where: { id: kitId, userId },
    });

    if (!kit) {
      throw new Error("Kit not found");
    }

    // Verify all gear items belong to user
    const gearItems = await prisma.gearItem.findMany({
      where: {
        id: { in: gearItemIds },
        userId,
      },
    });

    if (gearItems.length !== gearItemIds.length) {
      throw new Error("Some gear items not found or unauthorized");
    }

    // Create kit items (skip duplicates)
    await prisma.gearKitItem.createMany({
      data: gearItemIds.map((gearItemId) => ({
        kitId,
        gearItemId,
      })),
      skipDuplicates: true,
    });
  },

  /**
   * Remove gear items from a kit
   */
  async removeItems(
    kitId: string,
    gearItemIds: string[],
    userId: string
  ): Promise<void> {
    const kit = await prisma.gearKit.findFirst({
      where: { id: kitId, userId },
    });

    if (!kit) {
      throw new Error("Kit not found");
    }

    await prisma.gearKitItem.deleteMany({
      where: {
        kitId,
        gearItemId: { in: gearItemIds },
      },
    });
  },

  /**
   * Replace all items in a kit
   */
  async setItems(
    kitId: string,
    gearItemIds: string[],
    userId: string
  ): Promise<void> {
    const kit = await prisma.gearKit.findFirst({
      where: { id: kitId, userId },
    });

    if (!kit) {
      throw new Error("Kit not found");
    }

    await prisma.$transaction(async (tx) => {
      // Remove all existing items
      await tx.gearKitItem.deleteMany({
        where: { kitId },
      });

      // Verify all gear items belong to user
      const gearItems = await tx.gearItem.findMany({
        where: {
          id: { in: gearItemIds },
          userId,
        },
      });

      if (gearItems.length !== gearItemIds.length) {
        throw new Error("Some gear items not found or unauthorized");
      }

      // Add new items
      if (gearItemIds.length > 0) {
        await tx.gearKitItem.createMany({
          data: gearItemIds.map((gearItemId) => ({
            kitId,
            gearItemId,
          })),
        });
      }
    });
  },
};

/**
 * Data access layer for DiveGearItem operations
 */
export const diveGearRepository = {
  /**
   * Get gear items for a dive
   */
  async getGearForDive(diveId: string, userId: string): Promise<DiveGearItemWithGear[]> {
    // Verify dive ownership
    const dive = await prisma.diveLog.findFirst({
      where: { id: diveId, userId },
    });

    if (!dive) {
      throw new Error("Dive not found");
    }

    return prisma.diveGearItem.findMany({
      where: { diveId },
      include: {
        gearItem: true,
      },
    });
  },

  /**
   * Set gear items for a dive (replaces existing)
   */
  async setGearForDive(
    diveId: string,
    gearItemIds: string[],
    userId: string
  ): Promise<void> {
    // Verify dive ownership
    const dive = await prisma.diveLog.findFirst({
      where: { id: diveId, userId },
    });

    if (!dive) {
      throw new Error("Dive not found");
    }

    await prisma.$transaction(async (tx) => {
      // Remove all existing gear associations
      await tx.diveGearItem.deleteMany({
        where: { diveId },
      });

      // Verify all gear items belong to user
      if (gearItemIds.length > 0) {
        const gearItems = await tx.gearItem.findMany({
          where: {
            id: { in: gearItemIds },
            userId,
          },
        });

        if (gearItems.length !== gearItemIds.length) {
          throw new Error("Some gear items not found or unauthorized");
        }

        // Create new associations
        await tx.diveGearItem.createMany({
          data: gearItemIds.map((gearItemId) => ({
            diveId,
            gearItemId,
          })),
        });
      }
    });
  },
};

