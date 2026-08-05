/** src/utils/authValidation.test.ts */
import { describe, expect, it } from "vitest";
import { EMAIL_RE, getPasswordChecks, isPasswordValid } from "./authValidation";

const labelled = (password: string) =>
  Object.fromEntries(
    getPasswordChecks(password).map((check) => [check.label, check.met])
  );

describe("EMAIL_RE", () => {
  it.each(["a@b.co", "first.last@example.com", "user+tag@sub.example.co.uk"])(
    "accepts %s",
    (email) => {
      expect(EMAIL_RE.test(email)).toBe(true);
    }
  );

  it.each([
    ["missing an @", "nobody.example.com"],
    ["missing a dot in the domain", "user@example"],
    ["missing a local part", "@example.com"],
    ["containing a space", "user name@example.com"],
    ["empty", ""],
  ])("rejects an address %s", (_why, email) => {
    expect(EMAIL_RE.test(email)).toBe(false);
  });
});

describe("getPasswordChecks", () => {
  it("reports every rule independently", () => {
    expect(labelled("Passw0rd!")).toEqual({
      "Between 6 and 72 characters": true,
      "At least one lowercase letter": true,
      "At least one uppercase letter": true,
      "At least one number": true,
      "At least one symbol": true,
    });
  });

  it("fails only the rule that is actually unmet", () => {
    expect(labelled("passw0rd!")["At least one uppercase letter"]).toBe(false);
    expect(labelled("PASSW0RD!")["At least one lowercase letter"]).toBe(false);
    expect(labelled("Password!")["At least one number"]).toBe(false);
    expect(labelled("Passw0rd")["At least one symbol"]).toBe(false);
  });

  it("treats any non-alphanumeric character as a symbol", () => {
    // Including a space — worth knowing, since it looks like a typo in review.
    expect(labelled("Passw0rd ")["At least one symbol"]).toBe(true);
    expect(labelled("Passw0rd€")["At least one symbol"]).toBe(true);
  });
});

describe("isPasswordValid", () => {
  it("accepts a password meeting every rule", () => {
    expect(isPasswordValid("Passw0rd!")).toBe(true);
  });

  it("enforces the length bounds", () => {
    // 72 is bcrypt's limit, which Supabase inherits — a longer password would
    // be silently truncated at the server, so it's rejected here instead.
    const body = "aA1!";
    expect(isPasswordValid("aA1!x")).toBe(false); // 5 chars
    expect(isPasswordValid("aA1!xy")).toBe(true); // 6 chars
    expect(isPasswordValid(body + "x".repeat(68))).toBe(true); // 72 chars
    expect(isPasswordValid(body + "x".repeat(69))).toBe(false); // 73 chars
  });

  it("rejects an empty password", () => {
    expect(isPasswordValid("")).toBe(false);
  });
});
