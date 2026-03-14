import { describe, it, expect } from "vitest";
import {
  getNextServiceDueAt,
  computeMaintenanceStatus,
  sortGearByMaintenanceDue,
  type MaintenanceStatus,
} from "@/features/gear/lib/maintenance";

// DUE_SOON_DAYS = 30 (from gear constants)

// ── getNextServiceDueAt ─────────────────────────────────────────────────

describe("getNextServiceDueAt", () => {
  it("returns null when no serviceIntervalMonths", () => {
    expect(
      getNextServiceDueAt({
        lastServicedAt: new Date("2026-01-15"),
        serviceIntervalMonths: null,
      })
    ).toBeNull();
  });

  it("returns null when serviceIntervalMonths is 0", () => {
    expect(
      getNextServiceDueAt({
        lastServicedAt: new Date("2026-01-15"),
        serviceIntervalMonths: 0,
      })
    ).toBeNull();
  });

  it("returns null when no lastServicedAt", () => {
    expect(
      getNextServiceDueAt({
        lastServicedAt: null,
        serviceIntervalMonths: 12,
      })
    ).toBeNull();
  });

  it("returns correct due date for 12-month interval", () => {
    // Use Date constructor to avoid timezone parsing issues
    const lastServiced = new Date(2025, 5, 15); // June 15, 2025
    const result = getNextServiceDueAt({
      lastServicedAt: lastServiced,
      serviceIntervalMonths: 12,
    });
    expect(result).not.toBeNull();
    expect(result!.getFullYear()).toBe(2026);
    expect(result!.getMonth()).toBe(5); // June (0-indexed)
    expect(result!.getDate()).toBe(15);
  });

  it("returns correct due date for 6-month interval", () => {
    const lastServiced = new Date(2026, 0, 15); // Jan 15, 2026
    const result = getNextServiceDueAt({
      lastServicedAt: lastServiced,
      serviceIntervalMonths: 6,
    });
    expect(result).not.toBeNull();
    expect(result!.getMonth()).toBe(6); // July
  });

  it("handles month overflow (e.g., Oct + 3 = Jan next year)", () => {
    const lastServiced = new Date(2025, 9, 15); // Oct 15, 2025
    const result = getNextServiceDueAt({
      lastServicedAt: lastServiced,
      serviceIntervalMonths: 3,
    });
    expect(result).not.toBeNull();
    expect(result!.getFullYear()).toBe(2026);
    expect(result!.getMonth()).toBe(0); // January
  });
});

// ── computeMaintenanceStatus ────────────────────────────────────────────

describe("computeMaintenanceStatus", () => {
  it("returns NO_SCHEDULE when no interval set", () => {
    expect(
      computeMaintenanceStatus({
        lastServicedAt: new Date(),
        serviceIntervalMonths: null,
      })
    ).toBe("NO_SCHEDULE");
  });

  it("returns NO_SCHEDULE when interval is 0", () => {
    expect(
      computeMaintenanceStatus({
        lastServicedAt: new Date(),
        serviceIntervalMonths: 0,
      })
    ).toBe("NO_SCHEDULE");
  });

  it("returns UNKNOWN when interval set but never serviced", () => {
    expect(
      computeMaintenanceStatus({
        lastServicedAt: null,
        serviceIntervalMonths: 12,
      })
    ).toBe("UNKNOWN");
  });

  it("returns OVERDUE when past due date", () => {
    // Last serviced 13 months ago, interval is 12 months → overdue
    const thirteenMonthsAgo = new Date();
    thirteenMonthsAgo.setMonth(thirteenMonthsAgo.getMonth() - 13);

    expect(
      computeMaintenanceStatus({
        lastServicedAt: thirteenMonthsAgo,
        serviceIntervalMonths: 12,
      })
    ).toBe("OVERDUE");
  });

  it("returns DUE_SOON when within 30 days of due date", () => {
    // Last serviced 11.5 months ago, interval is 12 months → due in ~15 days
    const elevenAndHalfMonthsAgo = new Date();
    elevenAndHalfMonthsAgo.setDate(elevenAndHalfMonthsAgo.getDate() - 345);

    expect(
      computeMaintenanceStatus({
        lastServicedAt: elevenAndHalfMonthsAgo,
        serviceIntervalMonths: 12,
      })
    ).toBe("DUE_SOON");
  });

  it("returns UP_TO_DATE when well before due date", () => {
    // Last serviced 1 month ago, interval is 12 months → 11 months to go
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    expect(
      computeMaintenanceStatus({
        lastServicedAt: oneMonthAgo,
        serviceIntervalMonths: 12,
      })
    ).toBe("UP_TO_DATE");
  });

  it("returns DUE_SOON at exactly 30 days before due", () => {
    // Due date exactly 30 days from now
    const dueIn30Days = new Date();
    dueIn30Days.setDate(dueIn30Days.getDate() + 30);

    // Last serviced = dueDate - intervalMonths
    const lastServiced = new Date(dueIn30Days);
    lastServiced.setMonth(lastServiced.getMonth() - 12);

    expect(
      computeMaintenanceStatus({
        lastServicedAt: lastServiced,
        serviceIntervalMonths: 12,
      })
    ).toBe("DUE_SOON");
  });
});

// ── sortGearByMaintenanceDue ────────────────────────────────────────────

describe("sortGearByMaintenanceDue", () => {
  const makeItem = (
    id: string,
    lastServicedAt: Date | null,
    serviceIntervalMonths: number | null
  ) =>
    ({
      id,
      lastServicedAt,
      serviceIntervalMonths,
    }) as any;

  it("sorts OVERDUE before DUE_SOON before UP_TO_DATE", () => {
    const now = new Date();
    const overdue = makeItem(
      "overdue",
      new Date(now.getTime() - 400 * 86400000),
      12
    );
    const dueSoon = makeItem(
      "due-soon",
      new Date(now.getTime() - 345 * 86400000),
      12
    );
    const upToDate = makeItem(
      "ok",
      new Date(now.getTime() - 30 * 86400000),
      12
    );

    const sorted = sortGearByMaintenanceDue(
      [upToDate, overdue, dueSoon],
      (item) => computeMaintenanceStatus(item)
    );

    expect(sorted[0].id).toBe("overdue");
    expect(sorted[1].id).toBe("due-soon");
    expect(sorted[2].id).toBe("ok");
  });

  it("sorts NO_SCHEDULE last", () => {
    const now = new Date();
    const noSchedule = makeItem("no-schedule", null, null);
    const upToDate = makeItem(
      "ok",
      new Date(now.getTime() - 30 * 86400000),
      12
    );

    const sorted = sortGearByMaintenanceDue([noSchedule, upToDate], (item) =>
      computeMaintenanceStatus(item)
    );

    expect(sorted[0].id).toBe("ok");
    expect(sorted[1].id).toBe("no-schedule");
  });

  it("sorts two OVERDUE items by soonest due date first", () => {
    const now = new Date();
    // Both overdue but "more-overdue" has been overdue longer
    const moreOverdue = makeItem(
      "more-overdue",
      new Date(now.getTime() - 500 * 86400000),
      12
    );
    const lessOverdue = makeItem(
      "less-overdue",
      new Date(now.getTime() - 400 * 86400000),
      12
    );

    const sorted = sortGearByMaintenanceDue(
      [lessOverdue, moreOverdue],
      (item) => computeMaintenanceStatus(item)
    );

    // More overdue item has earlier due date → sorted first
    expect(sorted[0].id).toBe("more-overdue");
    expect(sorted[1].id).toBe("less-overdue");
  });

  it("does not mutate original array", () => {
    const items = [makeItem("b", null, null), makeItem("a", null, null)];
    const original = [...items];

    sortGearByMaintenanceDue(items, () => "NO_SCHEDULE");

    expect(items[0].id).toBe(original[0].id);
    expect(items[1].id).toBe(original[1].id);
  });

  it("handles empty array", () => {
    const sorted = sortGearByMaintenanceDue([], () => "NO_SCHEDULE");
    expect(sorted).toEqual([]);
  });
});
