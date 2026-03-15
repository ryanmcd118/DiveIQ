import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock next-auth
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

// Mock authOptions
vi.mock("@/features/auth/lib/auth", () => ({
  authOptions: {},
}));

// Mock repository
vi.mock("@/services/database/repositories/divePlanRepository", () => ({
  divePlanRepository: {
    findMany: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
}));

// Mock AI service — prevent real OpenAI calls
const mockBriefing = {
  keyConsiderations: ["Test consideration"],
  conditions: {
    waterTemp: { value: "25°C", badge: "seasonal" as const },
    visibility: { value: "20m", badge: null },
    seaState: { value: "Calm", badge: null },
  },
  siteConditions: ["Mild current"],
  hazards: [],
  experienceNotes: ["Your cert covers this depth"],
  gearNotes: ["3mm wetsuit appropriate"],
};

vi.mock("@/services/ai/openaiService", () => ({
  generateDivePlanBriefing: vi.fn(),
  generateUpdatedDivePlanBriefing: vi.fn(),
  generateDivePlanBriefingStream: vi.fn(),
}));

// Mock OpenAI constructor (openaiService imports it at module level)
vi.mock("openai", () => ({
  default: class {
    chat = { completions: { create: vi.fn() } };
  },
}));

import { GET, POST, PUT, DELETE } from "@/app/api/dive-plans/route";
import { POST as PreviewPOST } from "@/app/api/dive-plans/preview/route";
import { getServerSession } from "next-auth";
import { divePlanRepository } from "@/services/database/repositories/divePlanRepository";
import {
  generateDivePlanBriefing,
  generateUpdatedDivePlanBriefing,
  generateDivePlanBriefingStream,
} from "@/services/ai/openaiService";

// ── Helpers ─────────────────────────────────────────────────────────────

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

function makePost(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost:3000/api/dive-plans", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

function makePut(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost:3000/api/dive-plans", {
    method: "PUT",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

function makeDelete(id?: string): NextRequest {
  const url = new URL("http://localhost:3000/api/dive-plans");
  if (id) url.searchParams.set("id", id);
  return new NextRequest(url, { method: "DELETE" });
}

function makePreviewPost(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost:3000/api/dive-plans/preview", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

const validPlanBody = {
  region: "Caribbean",
  siteName: "Coral Garden",
  date: "2026-06-15",
  maxDepthCm: 1829,
  bottomTime: 45,
  experienceLevel: "Intermediate",
};

const mockSavedPlan = {
  id: "plan-1",
  userId: USER_ID,
  date: "2026-06-15",
  region: "Caribbean",
  siteName: "Coral Garden",
  maxDepthCm: 1829,
  bottomTime: 45,
  experienceLevel: "Intermediate",
  riskLevel: "Low",
  aiAdvice: "Test consideration",
  aiBriefing: mockBriefing,
  createdAt: new Date("2026-06-15"),
  updatedAt: new Date("2026-06-15"),
};

// ── Tests ───────────────────────────────────────────────────────────────

describe("dive plans API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Auth guard ──────────────────────────────────────────────────────

  describe("auth guard", () => {
    beforeEach(() => {
      mockNoAuth();
    });

    it("GET returns 401 when unauthenticated", async () => {
      const res = await GET();
      expect(res.status).toBe(401);
    });

    it("POST returns 401 when unauthenticated", async () => {
      const res = await POST(makePost(validPlanBody));
      expect(res.status).toBe(401);
    });

    it("PUT returns 401 when unauthenticated", async () => {
      const res = await PUT(makePut({ id: "plan-1", ...validPlanBody }));
      expect(res.status).toBe(401);
    });

    it("DELETE returns 401 when unauthenticated", async () => {
      const res = await DELETE(makeDelete("plan-1"));
      expect(res.status).toBe(401);
    });
  });

  // ── GET ─────────────────────────────────────────────────────────────

  describe("GET /api/dive-plans", () => {
    beforeEach(() => {
      mockAuth();
    });

    it("returns plans for authenticated user", async () => {
      vi.mocked(divePlanRepository.findMany).mockResolvedValue([
        mockSavedPlan,
      ] as any);

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.plans).toHaveLength(1);
      expect(data.plans[0].id).toBe("plan-1");
    });

    it("returns empty array when user has no plans", async () => {
      vi.mocked(divePlanRepository.findMany).mockResolvedValue([]);

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.plans).toEqual([]);
    });

    it("passes userId and ordering to repository", async () => {
      vi.mocked(divePlanRepository.findMany).mockResolvedValue([]);

      await GET();

      expect(divePlanRepository.findMany).toHaveBeenCalledWith({
        orderBy: "createdAt",
        take: 100,
        userId: USER_ID,
      });
    });

    it("returns 500 on repository error", async () => {
      vi.mocked(divePlanRepository.findMany).mockRejectedValue(
        new Error("DB error")
      );

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toContain("Failed to fetch");
    });
  });

  // ── POST ────────────────────────────────────────────────────────────

  describe("POST /api/dive-plans", () => {
    beforeEach(() => {
      mockAuth();
      vi.mocked(generateDivePlanBriefing).mockResolvedValue(mockBriefing);
      vi.mocked(divePlanRepository.create).mockResolvedValue(
        mockSavedPlan as any
      );
    });

    it("creates a plan and returns it with briefing", async () => {
      const res = await POST(makePost(validPlanBody));
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.plan).toBeDefined();
      expect(data.plan.id).toBe("plan-1");
      expect(data.aiBriefing).toBeDefined();
      expect(data.aiBriefing.keyConsiderations).toEqual(["Test consideration"]);
      expect(data.aiAdvice).toBe("Test consideration");
    });

    it("stores depth in canonical cm", async () => {
      await POST(makePost(validPlanBody));

      expect(divePlanRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ maxDepthCm: 1829 }),
        USER_ID
      );
    });

    it("converts depth to meters for AI service", async () => {
      await POST(makePost({ ...validPlanBody, maxDepthCm: 1829 }));

      expect(generateDivePlanBriefing).toHaveBeenCalledWith(
        expect.objectContaining({
          maxDepth: 18.29, // cmToMeters(1829)
        })
      );
    });

    it("calculates risk level and stores it", async () => {
      await POST(makePost(validPlanBody));

      expect(divePlanRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          riskLevel: expect.stringMatching(/Low|Moderate|High|Extreme/),
        }),
        USER_ID
      );
    });

    it("uses cached briefing when provided", async () => {
      await POST(
        makePost({
          ...validPlanBody,
          cachedBriefing: mockBriefing,
        })
      );

      // Should NOT call the AI service when cached briefing is valid
      expect(generateDivePlanBriefing).not.toHaveBeenCalled();

      // But should still save the plan
      expect(divePlanRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ aiBriefing: mockBriefing }),
        USER_ID
      );
    });

    it("calls AI service when no cached briefing", async () => {
      await POST(makePost(validPlanBody));

      expect(generateDivePlanBriefing).toHaveBeenCalledTimes(1);
    });

    it("defaults to metric unit system", async () => {
      await POST(makePost(validPlanBody));

      expect(generateDivePlanBriefing).toHaveBeenCalledWith(
        expect.objectContaining({ unitSystem: "metric" })
      );
    });

    it("detects imperial unit preferences", async () => {
      await POST(
        makePost({
          ...validPlanBody,
          unitPreferences: {
            depth: "ft",
            temperature: "f",
            pressure: "psi",
            weight: "lb",
          },
        })
      );

      expect(generateDivePlanBriefing).toHaveBeenCalledWith(
        expect.objectContaining({ unitSystem: "imperial" })
      );
    });

    it("returns 500 when AI service throws", async () => {
      vi.mocked(generateDivePlanBriefing).mockRejectedValue(
        new Error("OpenAI timeout")
      );

      const res = await POST(makePost(validPlanBody));
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toContain("Failed to generate");
    });

    it("returns 500 when repository throws", async () => {
      vi.mocked(divePlanRepository.create).mockRejectedValue(
        new Error("DB error")
      );

      const res = await POST(makePost(validPlanBody));
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toContain("Failed to generate");
    });

    it("returns 400 when region is missing", async () => {
      const { region: _, ...body } = validPlanBody;
      void _;
      const res = await POST(makePost(body));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("Validation failed");
    });

    it("returns 400 when maxDepthCm is not a positive integer", async () => {
      const res = await POST(makePost({ ...validPlanBody, maxDepthCm: -5 }));
      expect(res.status).toBe(400);
    });

    it("returns 400 when bottomTime is missing", async () => {
      const { bottomTime: _, ...body } = validPlanBody;
      void _;
      const res = await POST(makePost(body));
      expect(res.status).toBe(400);
    });
  });

  // ── PUT ─────────────────────────────────────────────────────────────

  describe("PUT /api/dive-plans", () => {
    beforeEach(() => {
      mockAuth();
      vi.mocked(generateUpdatedDivePlanBriefing).mockResolvedValue(
        mockBriefing
      );
      vi.mocked(divePlanRepository.update).mockResolvedValue(
        mockSavedPlan as any
      );
    });

    it("returns 400 when id is missing", async () => {
      const res = await PUT(makePut(validPlanBody));
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain("Missing plan id");
    });

    it("updates a plan and returns it with new briefing", async () => {
      const res = await PUT(makePut({ id: "plan-1", ...validPlanBody }));
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.plan).toBeDefined();
      expect(data.aiBriefing).toBeDefined();
      expect(data.aiAdvice).toBe("Test consideration");
    });

    it("calls generateUpdatedDivePlanBriefing (not generate)", async () => {
      await PUT(makePut({ id: "plan-1", ...validPlanBody }));

      expect(generateUpdatedDivePlanBriefing).toHaveBeenCalledTimes(1);
      expect(generateDivePlanBriefing).not.toHaveBeenCalled();
    });

    it("passes userId for ownership check", async () => {
      await PUT(makePut({ id: "plan-1", ...validPlanBody }));

      expect(divePlanRepository.update).toHaveBeenCalledWith(
        "plan-1",
        expect.any(Object),
        USER_ID
      );
    });

    it("returns 500 when update throws", async () => {
      vi.mocked(divePlanRepository.update).mockRejectedValue(
        new Error("Not found")
      );

      const res = await PUT(makePut({ id: "plan-1", ...validPlanBody }));
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toContain("Failed to update");
    });

    it("returns 400 when required fields are missing on PUT", async () => {
      const res = await PUT(makePut({ id: "plan-1" }));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("Validation failed");
    });

    it("returns 400 when maxDepthCm is negative on PUT", async () => {
      const res = await PUT(
        makePut({ id: "plan-1", ...validPlanBody, maxDepthCm: -10 })
      );
      expect(res.status).toBe(400);
    });
  });

  // ── DELETE ──────────────────────────────────────────────────────────

  describe("DELETE /api/dive-plans", () => {
    beforeEach(() => {
      mockAuth();
    });

    it("returns 400 when id is missing", async () => {
      const res = await DELETE(makeDelete());
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain("Missing plan id");
    });

    it("deletes a plan and returns success", async () => {
      vi.mocked(divePlanRepository.delete).mockResolvedValue(undefined);

      const res = await DELETE(makeDelete("plan-1"));
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.ok).toBe(true);
    });

    it("passes userId for ownership check", async () => {
      vi.mocked(divePlanRepository.delete).mockResolvedValue(undefined);

      await DELETE(makeDelete("plan-1"));

      expect(divePlanRepository.delete).toHaveBeenCalledWith("plan-1", USER_ID);
    });

    it("returns 500 when delete throws", async () => {
      vi.mocked(divePlanRepository.delete).mockRejectedValue(
        new Error("Not found")
      );

      const res = await DELETE(makeDelete("plan-1"));
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toContain("Failed to delete");
    });
  });

  // ── Preview endpoint ────────────────────────────────────────────────

  describe("POST /api/dive-plans/preview", () => {
    it("allows unauthenticated access (guest endpoint)", async () => {
      // No auth mock — this is a public endpoint
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode("{}"));
          controller.close();
        },
      });
      vi.mocked(generateDivePlanBriefingStream).mockResolvedValue(mockStream);

      const res = await PreviewPOST(makePreviewPost(validPlanBody));

      // Should NOT return 401
      expect(res.status).toBe(200);
    });

    it("returns streaming response with correct content-type", async () => {
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            new TextEncoder().encode(JSON.stringify(mockBriefing))
          );
          controller.close();
        },
      });
      vi.mocked(generateDivePlanBriefingStream).mockResolvedValue(mockStream);

      const res = await PreviewPOST(makePreviewPost(validPlanBody));

      expect(res.headers.get("Content-Type")).toBe("text/plain; charset=utf-8");
    });

    it("returns risk level in X-Risk-Level header", async () => {
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode("{}"));
          controller.close();
        },
      });
      vi.mocked(generateDivePlanBriefingStream).mockResolvedValue(mockStream);

      const res = await PreviewPOST(makePreviewPost(validPlanBody));

      const riskLevel = res.headers.get("X-Risk-Level");
      expect(riskLevel).toMatch(/Low|Moderate|High|Extreme/);
    });

    it("converts depth to meters for AI service", async () => {
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode("{}"));
          controller.close();
        },
      });
      vi.mocked(generateDivePlanBriefingStream).mockResolvedValue(mockStream);

      await PreviewPOST(
        makePreviewPost({ ...validPlanBody, maxDepthCm: 1829 })
      );

      expect(generateDivePlanBriefingStream).toHaveBeenCalledWith(
        expect.objectContaining({
          maxDepth: 18.29,
        })
      );
    });

    it("passes manual experience data for guest users", async () => {
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode("{}"));
          controller.close();
        },
      });
      vi.mocked(generateDivePlanBriefingStream).mockResolvedValue(mockStream);

      await PreviewPOST(
        makePreviewPost({
          ...validPlanBody,
          manualExperience: {
            diveCountRange: "25-99 dives",
            lastDiveRecency: "Within 3 months",
            highestCert: "Advanced Open Water Diver",
            experienceLevel: "Intermediate",
          },
        })
      );

      expect(generateDivePlanBriefingStream).toHaveBeenCalledWith(
        expect.objectContaining({
          manualExperience: expect.objectContaining({
            highestCert: "Advanced Open Water Diver",
          }),
        })
      );
    });

    it("returns 500 when streaming service throws", async () => {
      vi.mocked(generateDivePlanBriefingStream).mockRejectedValue(
        new Error("OpenAI timeout")
      );

      const res = await PreviewPOST(makePreviewPost(validPlanBody));
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toContain("Failed to generate");
    });
  });
});
