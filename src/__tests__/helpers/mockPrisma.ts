import { vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    diveLog: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
    },
    divePlan: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    gearItem: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    gearKit: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
    gearKitItem: {
      findMany: vi.fn(),
      createMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    diveGearItem: {
      findMany: vi.fn(),
      createMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    certificationDefinition: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    userCertification: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    account: {
      findUnique: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    session: {
      deleteMany: vi.fn(),
    },
    // $transaction passes a full prisma-shaped object to interactive
    // transaction callbacks so that tx.model.method() calls work correctly.
    // An empty object {} would cause silent failures in account deletion
    // and gear kit operations which use interactive transactions.
    $transaction: vi.fn((fn) => {
      if (typeof fn === "function") {
        return fn({
          user: { findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
          diveLog: { updateMany: vi.fn(), deleteMany: vi.fn() },
          divePlan: { deleteMany: vi.fn() },
          gearItem: { deleteMany: vi.fn() },
          gearKit: { deleteMany: vi.fn() },
          gearKitItem: { deleteMany: vi.fn() },
          diveGearItem: { deleteMany: vi.fn() },
          userCertification: { deleteMany: vi.fn() },
          account: { deleteMany: vi.fn() },
          session: { deleteMany: vi.fn() },
        });
      }
      return Promise.all(fn);
    }),
  },
}));
