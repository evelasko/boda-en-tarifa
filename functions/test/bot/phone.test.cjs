const {
  normalizeE164,
  toMetaWaId,
  fromMetaWaId,
  maskPhone,
} = require("../../lib/bot/lib/phone.js");

describe("phone helpers", () => {
  describe("normalizeE164", () => {
    test("accepts canonical E.164 unchanged", () => {
      expect(normalizeE164("+34612345678")).toBe("+34612345678");
    });

    test("adds + to Meta wa_id form", () => {
      expect(normalizeE164("34612345678")).toBe("+34612345678");
    });

    test("strips whitespace, dashes, parentheses", () => {
      expect(normalizeE164("+34 (612) 345-678")).toBe("+34612345678");
    });

    test("rejects empty input", () => {
      expect(() => normalizeE164("")).toThrow(/empty/);
    });

    test("rejects leading zero in country code", () => {
      expect(() => normalizeE164("+0612345678")).toThrow(/not E\.164/);
    });

    test("rejects too-short numbers", () => {
      expect(() => normalizeE164("+345")).toThrow(/not E\.164/);
    });

    test("rejects non-digit characters after cleaning", () => {
      expect(() => normalizeE164("+34abc12345678")).toThrow(/not E\.164/);
    });
  });

  describe("toMetaWaId / fromMetaWaId", () => {
    test("toMetaWaId drops leading +", () => {
      expect(toMetaWaId("+34612345678")).toBe("34612345678");
    });

    test("toMetaWaId is idempotent on already-stripped input", () => {
      expect(toMetaWaId("34612345678")).toBe("34612345678");
    });

    test("fromMetaWaId is round-trip safe", () => {
      const e164 = "+34612345678";
      expect(fromMetaWaId(toMetaWaId(e164))).toBe(e164);
    });
  });

  describe("maskPhone", () => {
    test("masks the middle, keeps prefix and last 3", () => {
      expect(maskPhone("+34612345678")).toBe("+34••••••678");
    });

    test("handles undefined / null", () => {
      expect(maskPhone(undefined)).toBe("(unknown)");
      expect(maskPhone(null)).toBe("(unknown)");
    });

    test("short strings fully masked", () => {
      expect(maskPhone("+34")).toBe("•••");
    });
  });
});
