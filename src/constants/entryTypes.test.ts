/** src/constants/entryTypes.test.ts */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { EntryType } from "../types/database.types";
import {
  ENTRY_TYPE_LABELS,
  ENTRY_TYPE_PLACEHOLDERS,
  getEntryActivityLabel,
  getEntryTypeLabel,
  getEntryVerbPhrase,
} from "./entryTypes";

const ENTRY_TYPES: EntryType[] = ["review", "rating", "status_update"];

describe("label and placeholder maps", () => {
  it("covers every entry type", () => {
    for (const type of ENTRY_TYPES) {
      expect(ENTRY_TYPE_LABELS[type]).toBeTruthy();
      expect(ENTRY_TYPE_PLACEHOLDERS[type]).toBeTruthy();
    }
  });
});

describe("getEntryTypeLabel", () => {
  it.each([
    ["review", "Review"],
    ["rating", "Rating"],
    ["status_update", "Status Update"],
  ])("labels %s as %s", (type, expected) => {
    expect(getEntryTypeLabel(type)).toBe(expected);
  });

  it("echoes an unknown type rather than rendering nothing", () => {
    expect(getEntryTypeLabel("something_new")).toBe("something_new");
  });
});

describe("getEntryVerbPhrase", () => {
  it.each([
    ["review", "shared a review"],
    ["rating", "rated it"],
    ["status_update", "posted a status update"],
  ])("describes %s as '%s'", (type, expected) => {
    expect(getEntryVerbPhrase(type)).toBe(expected);
  });

  it("falls back to a generic phrase for an unknown type", () => {
    expect(getEntryVerbPhrase("something_new")).toBe("posted an update");
  });
});

describe("getEntryActivityLabel", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-04T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("joins the verb phrase and the relative time", () => {
    expect(
      getEntryActivityLabel({
        entry_type: "review",
        created_at: "2026-08-04T11:18:00.000Z",
      })
    ).toBe("shared a review · 42m ago");
  });
});
