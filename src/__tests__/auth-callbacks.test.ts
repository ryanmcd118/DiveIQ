import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("bcryptjs", () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    account: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

// Mock PrismaAdapter to avoid real DB connection
vi.mock("@next-auth/prisma-adapter", () => ({
  PrismaAdapter: vi.fn(() => ({})),
}));

// Mock Google provider to avoid missing env vars
vi.mock("next-auth/providers/google", () => ({
  default: vi.fn(() => ({ id: "google", name: "Google", type: "oauth" })),
}));

import { authOptions } from "@/features/auth/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { JWT } from "next-auth/jwt";

// ── Extract callbacks and authorize function ────────────────────────────

const jwtCallback = authOptions.callbacks!.jwt!;
const sessionCallback = authOptions.callbacks!.session!;

// Extract the authorize function from the credentials provider
const credentialsProvider = authOptions.providers.find(
  (p) => p.id === "credentials"
) as any;
const authorize = credentialsProvider.options.authorize;

// ── Helpers ─────────────────────────────────────────────────────────────

const mockDbUser = {
  id: "user-1",
  email: "jane@example.com",
  password: "hashed-password",
  firstName: "Jane",
  lastName: "Diver",
  image: null,
  avatarUrl: "https://example.com/avatar.png",
  sessionVersion: 0,
};

// ── credentials authorize ───────────────────────────────────────────────

describe("credentials authorize", () => {
  beforeEach(() => vi.clearAllMocks());

  it("throws when email is missing", async () => {
    await expect(authorize({ password: "pass123" })).rejects.toThrow(
      "Invalid credentials"
    );
  });

  it("throws when password is missing", async () => {
    await expect(authorize({ email: "jane@example.com" })).rejects.toThrow(
      "Invalid credentials"
    );
  });

  it("throws when both are missing", async () => {
    await expect(authorize({})).rejects.toThrow("Invalid credentials");
  });

  it("throws when user not found in DB", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    await expect(
      authorize({ email: "unknown@example.com", password: "pass123" })
    ).rejects.toThrow("Invalid credentials");
  });

  it("throws when user has no password (OAuth-only account)", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      ...mockDbUser,
      password: null,
    } as any);

    await expect(
      authorize({ email: "jane@example.com", password: "pass123" })
    ).rejects.toThrow("Invalid credentials");
  });

  it("throws when bcrypt.compare returns false (wrong password)", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockDbUser as any);
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

    await expect(
      authorize({ email: "jane@example.com", password: "wrongpass" })
    ).rejects.toThrow("Invalid credentials");
  });

  it("returns user object on correct password", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockDbUser as any);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

    const result = await authorize({
      email: "jane@example.com",
      password: "correctpass",
    });

    expect(result).toEqual({
      id: "user-1",
      email: "jane@example.com",
      firstName: "Jane",
      lastName: "Diver",
      image: null,
      avatarUrl: "https://example.com/avatar.png",
    });
  });

  it("returned user does not include password hash", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockDbUser as any);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

    const result = await authorize({
      email: "jane@example.com",
      password: "correctpass",
    });

    expect((result as any).password).toBeUndefined();
  });
});

// ── jwt callback ────────────────────────────────────────────────────────

describe("jwt callback", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("initial sign-in (credentials user)", () => {
    it("populates token with user fields from credentials authorize result", async () => {
      const user = {
        id: "user-1",
        email: "jane@example.com",
        firstName: "Jane",
        lastName: "Diver",
        image: null,
        avatarUrl: "https://example.com/avatar.png",
      };

      // DB call for sessionVersion (credentials path) + sessionVersion check
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        sessionVersion: 0,
      } as any);

      const token = await jwtCallback({
        token: { sub: "user-1" } as JWT,
        user: user as any,
        account: null,
        trigger: "signIn",
      } as any);

      expect(token.id).toBe("user-1");
      expect(token.email).toBe("jane@example.com");
      expect(token.firstName).toBe("Jane");
      expect(token.lastName).toBe("Diver");
    });

    it("fetches sessionVersion from DB for credentials user", async () => {
      const user = {
        id: "user-1",
        email: "jane@example.com",
        firstName: "Jane",
        lastName: "Diver",
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        sessionVersion: 3,
      } as any);

      const token = await jwtCallback({
        token: { sub: "user-1" } as JWT,
        user: user as any,
        account: null,
        trigger: "signIn",
      } as any);

      expect(token.sessionVersion).toBe(3);
    });
  });

  describe("initial sign-in (OAuth user without firstName)", () => {
    it("fetches user fields from DB when firstName not in user object", async () => {
      const user = { id: "user-1", email: "jane@example.com" };

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        firstName: "Jane",
        lastName: "Diver",
        avatarUrl: "https://example.com/a.png",
        sessionVersion: 1,
      } as any);

      const token = await jwtCallback({
        token: { sub: "user-1" } as JWT,
        user: user as any,
        account: null,
        trigger: "signIn",
      } as any);

      expect(token.firstName).toBe("Jane");
      expect(token.lastName).toBe("Diver");
      expect(token.avatarUrl).toBe("https://example.com/a.png");
      expect(token.sessionVersion).toBe(1);
    });
  });

  describe("subsequent requests (sessionVersion check)", () => {
    it("returns token with invalidated=false when sessionVersion matches", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        sessionVersion: 5,
      } as any);

      const token = await jwtCallback({
        token: { id: "user-1", sessionVersion: 5 } as any,
        user: undefined as any,
        account: null,
        trigger: undefined,
      } as any);

      expect(token.invalidated).toBe(false);
      expect(token.sessionVersion).toBe(5);
    });

    it("sets invalidated=true when sessionVersion does not match", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        sessionVersion: 6,
      } as any);

      const token = await jwtCallback({
        token: { id: "user-1", sessionVersion: 5 } as any,
        user: undefined as any,
        account: null,
        trigger: undefined,
      } as any);

      expect(token.invalidated).toBe(true);
    });

    it("sets invalidated=true when user not found in DB", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const token = await jwtCallback({
        token: { id: "user-1", sessionVersion: 0 } as any,
        user: undefined as any,
        account: null,
        trigger: undefined,
      } as any);

      expect(token.invalidated).toBe(true);
    });

    it("sets invalidated=true when token has no id and no sub", async () => {
      const token = await jwtCallback({
        token: {} as JWT,
        user: undefined as any,
        account: null,
        trigger: undefined,
      } as any);

      expect(token.invalidated).toBe(true);
    });
  });
});

// ── session callback ────────────────────────────────────────────────────

describe("session callback", () => {
  beforeEach(() => vi.clearAllMocks());

  it("populates session.user from token fields", async () => {
    const token = {
      id: "user-1",
      email: "jane@example.com",
      firstName: "Jane",
      lastName: "Diver",
      avatarUrl: "https://example.com/avatar.png",
      sessionVersion: 3,
      invalidated: false,
    };

    const session = {
      user: {
        id: "",
        email: "",
        firstName: null as string | null,
        lastName: null as string | null,
        avatarUrl: null as string | null,
        sessionVersion: 0,
      },
      expires: "2099-01-01",
    };

    const result = (await sessionCallback({
      session: session as any,
      token: token as any,
    } as any)) as any;

    expect(result.user.id).toBe("user-1");
    expect(result.user.email).toBe("jane@example.com");
    expect(result.user.firstName).toBe("Jane");
    expect(result.user.lastName).toBe("Diver");
    expect(result.user.avatarUrl).toBe("https://example.com/avatar.png");
    expect(result.user.sessionVersion).toBe(3);
  });

  it("returns session unchanged when token is invalidated", async () => {
    const token = {
      id: "user-1",
      invalidated: true,
    };

    const session = {
      user: { id: "old-id", email: "old@example.com" },
      expires: "2099-01-01",
    };

    const result = (await sessionCallback({
      session: session as any,
      token: token as any,
    } as any)) as any;

    // Session should be returned unchanged — user fields NOT populated from token
    expect(result.user.id).toBe("old-id");
    expect(result.user.email).toBe("old@example.com");
  });

  it("returns session unchanged when token has no id or sub", async () => {
    const token = {};
    const session = {
      user: { id: "old-id" },
      expires: "2099-01-01",
    };

    const result = (await sessionCallback({
      session: session as any,
      token: token as any,
    } as any)) as any;

    expect(result.user.id).toBe("old-id");
  });

  it("uses token.sub when token.id is missing", async () => {
    const token = {
      sub: "user-from-sub",
      email: "sub@example.com",
      firstName: "Sub",
      lastName: "User",
      sessionVersion: 0,
      invalidated: false,
    };

    const session = {
      user: { id: "", email: "" },
      expires: "2099-01-01",
    };

    const result = (await sessionCallback({
      session: session as any,
      token: token as any,
    } as any)) as any;

    expect(result.user.id).toBe("user-from-sub");
  });

  it("initializes session.user when it is missing", async () => {
    const token = {
      id: "user-1",
      email: "jane@example.com",
      firstName: "Jane",
      lastName: "Diver",
      sessionVersion: 0,
      invalidated: false,
    };

    const session = {
      user: undefined as any,
      expires: "2099-01-01",
    };

    const result = (await sessionCallback({
      session: session as any,
      token: token as any,
    } as any)) as any;

    expect(result.user).toBeDefined();
    expect(result.user.id).toBe("user-1");
  });
});
