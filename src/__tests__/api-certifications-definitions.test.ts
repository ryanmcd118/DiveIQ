import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/certifications/definitions/route";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// Mock Prisma client
vi.mock("@/lib/prisma", () => ({
  prisma: {
    certificationDefinition: {
      findMany: vi.fn(),
    },
  },
}));

describe("API Route - GET /api/certifications/definitions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns certification definitions with expected shape", async () => {
    const mockDefinitions = [
      {
        id: "1",
        agency: "PADI",
        name: "Open Water Diver",
        slug: "open-water-diver",
        levelRank: 1,
        category: "core",
        badgeImageUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "2",
        agency: "PADI",
        name: "Advanced Open Water",
        slug: "advanced-open-water",
        levelRank: 2,
        category: "core",
        badgeImageUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    vi.mocked(prisma.certificationDefinition.findMany).mockResolvedValue(
      mockDefinitions as any
    );

    const req = new NextRequest("http://localhost:3000/api/certifications/definitions");
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("definitions");
    expect(Array.isArray(data.definitions)).toBe(true);
    expect(data.definitions.length).toBe(2);
    expect(data.definitions[0]).toHaveProperty("id");
    expect(data.definitions[0]).toHaveProperty("agency");
    expect(data.definitions[0]).toHaveProperty("name");
    expect(data.definitions[0]).toHaveProperty("category");
  });

  it("sorts definitions by category, levelRank, and name", async () => {
    const mockDefinitions = [
      {
        id: "3",
        agency: "PADI",
        name: "Rescue Diver",
        slug: "rescue-diver",
        levelRank: 3,
        category: "core",
        badgeImageUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "1",
        agency: "PADI",
        name: "Open Water Diver",
        slug: "open-water-diver",
        levelRank: 1,
        category: "core",
        badgeImageUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "4",
        agency: "PADI",
        name: "Wreck Diver",
        slug: "wreck-diver",
        levelRank: 1,
        category: "specialty",
        badgeImageUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    vi.mocked(prisma.certificationDefinition.findMany).mockResolvedValue(
      mockDefinitions as any
    );

    const req = new NextRequest("http://localhost:3000/api/certifications/definitions");
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    // Should be sorted: core first, then by levelRank, then by name
    expect(data.definitions[0].name).toBe("Open Water Diver");
    expect(data.definitions[1].name).toBe("Rescue Diver");
    expect(data.definitions[2].name).toBe("Wreck Diver");
  });

  it("filters by agency when query param provided", async () => {
    vi.mocked(prisma.certificationDefinition.findMany).mockResolvedValue([]);

    const req = new NextRequest(
      "http://localhost:3000/api/certifications/definitions?agency=PADI"
    );
    await GET(req);

    expect(prisma.certificationDefinition.findMany).toHaveBeenCalledWith({
      where: { agency: "PADI" },
    });
  });

  it("handles errors gracefully", async () => {
    vi.mocked(prisma.certificationDefinition.findMany).mockRejectedValue(
      new Error("Database error")
    );

    const req = new NextRequest("http://localhost:3000/api/certifications/definitions");
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toHaveProperty("error");
    expect(data.error).toBe("Failed to fetch certification definitions");
  });
});

