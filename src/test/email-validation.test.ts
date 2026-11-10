import { describe, expect, it } from "vitest";
import { validateEmail01 } from "@/lib/email-validation";
import { defaultJourney, type EmailRow } from "@/lib/journey-data";

const coherent: EmailRow = { email: "EML 01", sends: 1923, uniqueOpens: 500, clicks: 100, openRate: 26, ctr: 5.2, ctor: 20, bounce: 0, unsub: 0 };
describe("EML 01 consistency", () => {
  it("requires the confirmed 1,923 sends", () => {
    expect(validateEmail01({ ...coherent, sends: 12613 }).map(i => i.code)).toContain("sends");
  });
  it("flags 3,347 unique opens against 1,923 sends", () => {
    expect(validateEmail01({ ...coherent, uniqueOpens: 3347 }).map(i => i.code)).toContain("uniqueOpens");
  });
  it("flags the existing opening rate and CTR without mutating metrics", () => {
    const row = defaultJourney.emails.find(row => row.email === "EML 01");
    if (!row) throw new Error("Missing EML 01");
    const original = { ...row };
    expect(validateEmail01(row).map(i => i.code)).toEqual(["uniqueOpens", "openRate", "ctr"]);
    expect(row).toEqual(original);
  });
  it.each(["openRate", "ctr", "ctor", "bounce", "unsub"] as const)("flags invalid %s percentages", key => {
    expect(validateEmail01({ ...coherent, [key]: 101 }).map(i => i.code)).toContain(key);
  });
  it("checks CTOR using opens, not sends", () => {
    expect(validateEmail01({ ...coherent, ctor: 5.2 }).map(i => i.code)).toContain("ctor");
  });
  it("accepts coherent rounded ratios without guessing delivered counts", () => {
    expect(validateEmail01(coherent)).toEqual([]);
  });
  it("does not flag other emails", () => {
    expect(validateEmail01({ ...coherent, email: "EML 02", sends: 4510 })).toEqual([]);
  });
});