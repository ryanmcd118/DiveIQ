import { vi } from "vitest";

// Stub server-only to allow importing server modules in tests.
// Required because src/lib/prisma.ts imports server-only,
// which throws at import time in the test environment.
vi.mock("server-only", () => ({}));
