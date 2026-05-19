const crypto = require("node:crypto");
const {
  verifySignature,
  handleHandshake,
} = require("../../lib/bot/webhook/verify.js");

const SECRET = "test-app-secret";

function sign(body, secret = SECRET) {
  const hex = crypto.createHmac("sha256", secret).update(body, "utf8").digest("hex");
  return `sha256=${hex}`;
}

describe("verifySignature", () => {
  const body = JSON.stringify({hello: "world"});

  test("accepts a correctly-signed body", () => {
    expect(verifySignature(body, sign(body), SECRET)).toBe(true);
  });

  test("rejects a tampered body", () => {
    const sig = sign(body);
    expect(verifySignature(body + " ", sig, SECRET)).toBe(false);
  });

  test("rejects when the signature was made with a different secret", () => {
    const sig = sign(body, "other-secret");
    expect(verifySignature(body, sig, SECRET)).toBe(false);
  });

  test("rejects when the header is missing", () => {
    expect(verifySignature(body, undefined, SECRET)).toBe(false);
  });

  test("rejects when the header lacks the sha256= prefix", () => {
    const raw = sign(body).slice("sha256=".length);
    expect(verifySignature(body, raw, SECRET)).toBe(false);
  });

  test("rejects when the secret is empty", () => {
    expect(verifySignature(body, sign(body), "")).toBe(false);
  });

  test("rejects when the signature is the wrong length", () => {
    expect(verifySignature(body, "sha256=deadbeef", SECRET)).toBe(false);
  });

  test("rejects non-hex characters without throwing", () => {
    const bogus = "sha256=" + "z".repeat(64);
    expect(verifySignature(body, bogus, SECRET)).toBe(false);
  });
});

describe("handleHandshake", () => {
  const token = "verify-token-xyz";

  test("echoes challenge when token matches", () => {
    expect(
      handleHandshake(
        {mode: "subscribe", token, challenge: "123abc"},
        token
      )
    ).toEqual({status: 200, body: "123abc"});
  });

  test("403 when token mismatches", () => {
    expect(
      handleHandshake(
        {mode: "subscribe", token: "wrong", challenge: "123abc"},
        token
      ).status
    ).toBe(403);
  });

  test("403 when mode is missing", () => {
    expect(
      handleHandshake({token, challenge: "123abc"}, token).status
    ).toBe(403);
  });

  test("403 when challenge is missing", () => {
    expect(
      handleHandshake({mode: "subscribe", token}, token).status
    ).toBe(403);
  });

  test("403 when query is empty", () => {
    expect(handleHandshake({}, token).status).toBe(403);
  });
});
