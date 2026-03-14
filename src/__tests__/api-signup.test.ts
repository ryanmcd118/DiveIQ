import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock bcryptjs before importing the route
vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("hashed-password-abc123"),
    compare: vi.fn(),
  },
}));

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import { POST } from "@/app/api/auth/signup/route";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost:3000/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

const validBody = {
  email: "test@example.com",
  password: "securepass123",
  firstName: "Jane",
  lastName: "Diver",
};

describe("POST /api/auth/signup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("validation", () => {
    it("returns 400 when email is missing", async () => {
      const res = await POST(makeRequest({ ...validBody, email: undefined }));
      const data = await res.json();
      expect(res.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it("returns 400 when password is missing", async () => {
      const res = await POST(
        makeRequest({ ...validBody, password: undefined })
      );
      const data = await res.json();
      expect(res.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it("returns 400 when firstName is missing", async () => {
      const res = await POST(
        makeRequest({ ...validBody, firstName: undefined })
      );
      const data = await res.json();
      expect(res.status).toBe(400);
      expect(data.error).toContain("name");
    });

    it("returns 400 when lastName is missing", async () => {
      const res = await POST(
        makeRequest({ ...validBody, lastName: undefined })
      );
      const data = await res.json();
      expect(res.status).toBe(400);
      expect(data.error).toContain("name");
    });

    it("returns 400 when firstName is whitespace-only", async () => {
      const res = await POST(makeRequest({ ...validBody, firstName: "   " }));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    it("returns 400 for invalid email format", async () => {
      const res = await POST(
        makeRequest({ ...validBody, email: "not-an-email" })
      );
      const data = await res.json();
      expect(res.status).toBe(400);
      expect(data.error).toContain("email");
    });

    it("returns 400 for email without domain", async () => {
      const res = await POST(makeRequest({ ...validBody, email: "user@" }));
      expect(res.status).toBe(400);
    });

    it("returns 400 when password is shorter than 8 characters", async () => {
      const res = await POST(makeRequest({ ...validBody, password: "short" }));
      const data = await res.json();
      expect(res.status).toBe(400);
      expect(data.error).toContain("8 characters");
    });

    it("accepts exactly 8 character password", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: "new-id",
        email: validBody.email,
        firstName: "Jane",
        lastName: "Diver",
      } as any);

      const res = await POST(
        makeRequest({ ...validBody, password: "12345678" })
      );
      expect(res.status).toBe(201);
    });
  });

  describe("duplicate email", () => {
    it("returns 400 when email already exists", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "existing-id",
        email: validBody.email,
      } as any);

      const res = await POST(makeRequest(validBody));
      const data = await res.json();
      expect(res.status).toBe(400);
      expect(data.error).toContain("already exists");
    });
  });

  describe("success", () => {
    beforeEach(() => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: "new-user-id",
        email: validBody.email,
        firstName: "Jane",
        lastName: "Diver",
        password: "hashed-password-abc123",
      } as any);
    });

    it("returns 201 with user data on success", async () => {
      const res = await POST(makeRequest(validBody));
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.user).toBeDefined();
      expect(data.user.id).toBe("new-user-id");
      expect(data.user.email).toBe(validBody.email);
      expect(data.user.firstName).toBe("Jane");
      expect(data.user.lastName).toBe("Diver");
    });

    it("does not return password in response", async () => {
      const res = await POST(makeRequest(validBody));
      const data = await res.json();

      expect(data.user.password).toBeUndefined();
      expect(JSON.stringify(data)).not.toContain("hashed-password");
    });

    it("hashes the password with bcrypt before storing", async () => {
      await POST(makeRequest(validBody));

      expect(bcrypt.hash).toHaveBeenCalledWith(validBody.password, 10);
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            password: "hashed-password-abc123",
          }),
        })
      );
    });

    it("trims firstName and lastName before storing", async () => {
      await POST(
        makeRequest({
          ...validBody,
          firstName: "  Jane  ",
          lastName: "  Diver  ",
        })
      );

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            firstName: "Jane",
            lastName: "Diver",
          }),
        })
      );
    });

    it("stores email as-is (no trimming)", async () => {
      await POST(makeRequest(validBody));

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: validBody.email,
          }),
        })
      );
    });
  });

  describe("error handling", () => {
    it("returns 500 when database throws", async () => {
      vi.mocked(prisma.user.findUnique).mockRejectedValue(
        new Error("DB connection lost")
      );

      const res = await POST(makeRequest(validBody));
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toContain("Failed to create account");
    });

    it("returns 500 when user creation throws", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.create).mockRejectedValue(
        new Error("Unique constraint failed")
      );

      const res = await POST(makeRequest(validBody));
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toContain("Failed to create account");
    });
  });
});
