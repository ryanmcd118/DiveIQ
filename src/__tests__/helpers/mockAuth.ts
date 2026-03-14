import { vi } from "vitest";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

export async function mockAuthenticated(userId = "test-user-id") {
  const { getServerSession } = await import("next-auth");
  vi.mocked(getServerSession).mockResolvedValue({
    user: { id: userId, email: "test@example.com", name: "Test User" },
    expires: "2099-01-01",
  });
}

export async function mockUnauthenticated() {
  const { getServerSession } = await import("next-auth");
  vi.mocked(getServerSession).mockResolvedValue(null);
}
