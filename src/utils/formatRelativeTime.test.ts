/**
 * src/utils/formatRelativeTime.test.ts
 *
 * Time-dependent, so every case pins "now". The absolute branch is also
 * locale-dependent; vite.config.ts pins TZ=UTC for the run.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatRelativeTime } from "./formatRelativeTime";

const NOW = new Date("2026-08-04T12:00:00.000Z");
/** An ISO timestamp `ms` before the pinned now. */
const ago = (ms: number) => new Date(NOW.getTime() - ms).toISOString();

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("formatRelativeTime", () => {
  it("says 'Just now' under a minute", () => {
    expect(formatRelativeTime(ago(0))).toBe("Just now");
    expect(formatRelativeTime(ago(59 * SECOND))).toBe("Just now");
  });

  it("counts whole minutes up to an hour", () => {
    expect(formatRelativeTime(ago(MINUTE))).toBe("1m ago");
    expect(formatRelativeTime(ago(42 * MINUTE))).toBe("42m ago");
    expect(formatRelativeTime(ago(HOUR - SECOND))).toBe("59m ago");
  });

  it("counts whole hours up to a day", () => {
    expect(formatRelativeTime(ago(HOUR))).toBe("1h ago");
    expect(formatRelativeTime(ago(23 * HOUR))).toBe("23h ago");
  });

  it("says 'Yesterday' through the second day", () => {
    expect(formatRelativeTime(ago(DAY))).toBe("Yesterday");
    expect(formatRelativeTime(ago(2 * DAY - SECOND))).toBe("Yesterday");
  });

  it("switches to an absolute date past two days", () => {
    // Month and day only, since it's the same year as the pinned now.
    const label = formatRelativeTime(ago(3 * DAY));
    expect(label).toContain("Aug");
    expect(label).toContain("1");
    expect(label).not.toContain("2026");
  });

  it("includes the year once the date is in a different one", () => {
    expect(formatRelativeTime("2025-07-14T12:00:00.000Z")).toContain("2025");
  });
});
