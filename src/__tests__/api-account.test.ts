import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("next-auth/jwt", () => ({
  getToken: vi.fn(),
  encode: vi.fn().mockResolvedValue("new-jwt-token"),
}));

vi.mock("@/features/auth/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("bcryptjs", () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn().mockResolvedValue("new-hashed-password"),
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { DELETE as AccountDELETE } from "@/app/api/account/route";
import { PUT } from "@/app/api/account/password/route";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

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

function makePut(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost:3000/api/account/password", {
    method: "PUT",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

function makeDeleteReq(): NextRequest {
  return new NextRequest("http://localhost:3000/api/account", {
    method: "DELETE",
  });
}

describe("account API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── DELETE /api/account ─────────────────────────────────────────────

  describe("DELETE /api/account", () => {
    it("returns 401 when unauthenticated", async () => {
      mockNoAuth();
      const res = await AccountDELETE(makeDeleteReq());
      expect(res.status).toBe(401);
    });

    it("deletes account and returns success", async () => {
      mockAuth();
      vi.mocked(prisma.$transaction).mockResolvedValue(undefined);

      const res = await AccountDELETE(makeDeleteReq());
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.ok).toBe(true);
    });

    it("calls $transaction for cascade deletion", async () => {
      mockAuth();
      vi.mocked(prisma.$transaction).mockResolvedValue(undefined);

      await AccountDELETE(makeDeleteReq());

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function));
    });

    it("returns 500 on transaction error", async () => {
      mockAuth();
      vi.mocked(prisma.$transaction).mockRejectedValue(
        new Error("Transaction failed")
      );

      const res = await AccountDELETE(makeDeleteReq());
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toContain("Failed to delete");
    });
  });

  // ── PUT /api/account/password ───────────────────────────────────────

  describe("PUT /api/account/password", () => {
    it("returns 401 when unauthenticated", async () => {
      mockNoAuth();
      const res = await PUT(
        makePut({ currentPassword: "old", newPassword: "newpass12" })
      );
      expect(res.status).toBe(401);
    });

    it("returns 400 when currentPassword is missing", async () => {
      mockAuth();
      const res = await PUT(makePut({ newPassword: "newpass12" }));
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain("required");
    });

    it("returns 400 when newPassword is missing", async () => {
      mockAuth();
      const res = await PUT(makePut({ currentPassword: "oldpass12" }));
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain("required");
    });

    it("returns 400 when newPassword is too short", async () => {
      mockAuth();
      const res = await PUT(
        makePut({ currentPassword: "oldpass12", newPassword: "short" })
      );
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain("8 characters");
    });

    it("returns 404 when user not found", async () => {
      mockAuth();
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const res = await PUT(
        makePut({ currentPassword: "oldpass12", newPassword: "newpass12" })
      );
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toContain("User not found");
    });

    it("returns 400 for OAuth-only user (no password)", async () => {
      mockAuth();
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: USER_ID,
        password: null,
      } as any);

      const res = await PUT(
        makePut({ currentPassword: "oldpass12", newPassword: "newpass12" })
      );
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain("Google");
    });

    it("returns 400 when current password is incorrect", async () => {
      mockAuth();
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: USER_ID,
        password: "hashed-old-password",
      } as any);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      const res = await PUT(
        makePut({ currentPassword: "wrongpass", newPassword: "newpass12" })
      );
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain("incorrect");
    });

    it("returns 400 when new password is same as current", async () => {
      mockAuth();
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: USER_ID,
        password: "hashed-old-password",
      } as any);
      // First compare: current password is valid
      // Second compare: new password matches old (same password)
      vi.mocked(bcrypt.compare)
        .mockResolvedValueOnce(true as never)
        .mockResolvedValueOnce(true as never);

      const res = await PUT(
        makePut({
          currentPassword: "oldpass12",
          newPassword: "oldpass12",
        })
      );
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain("different");
    });

    it("changes password and returns success on happy path", async () => {
      mockAuth();
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: USER_ID,
        password: "hashed-old-password",
      } as any);
      // First compare: current valid, second compare: not same
      vi.mocked(bcrypt.compare)
        .mockResolvedValueOnce(true as never)
        .mockResolvedValueOnce(false as never);
      vi.mocked(getToken).mockResolvedValue({
        id: USER_ID,
        sessionVersion: 0,
      } as any);
      vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
        if (typeof fn === "function") {
          return fn({
            user: {
              update: vi.fn().mockResolvedValue({ sessionVersion: 1 }),
            },
          } as any);
        }
        return undefined;
      });

      const res = await PUT(
        makePut({
          currentPassword: "oldpass12",
          newPassword: "newpass12",
        })
      );
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.ok).toBe(true);
    });

    it("calls bcrypt.hash for new password", async () => {
      mockAuth();
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: USER_ID,
        password: "hashed-old-password",
      } as any);
      vi.mocked(bcrypt.compare)
        .mockResolvedValueOnce(true as never)
        .mockResolvedValueOnce(false as never);
      vi.mocked(getToken).mockResolvedValue({
        id: USER_ID,
        sessionVersion: 0,
      } as any);
      vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
        if (typeof fn === "function") {
          return fn({
            user: {
              update: vi.fn().mockResolvedValue({ sessionVersion: 1 }),
            },
          } as any);
        }
        return undefined;
      });

      await PUT(
        makePut({
          currentPassword: "oldpass12",
          newPassword: "newpass12",
        })
      );

      expect(bcrypt.hash).toHaveBeenCalledWith("newpass12", 10);
    });

    it("returns 500 on database error", async () => {
      mockAuth();
      vi.mocked(prisma.user.findUnique).mockRejectedValue(
        new Error("DB error")
      );

      const res = await PUT(
        makePut({
          currentPassword: "oldpass12",
          newPassword: "newpass12",
        })
      );
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toContain("Failed to change password");
    });
  });
});
