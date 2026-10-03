import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { detectFileType } from "@/lib/media/detect";
import { resolveMediaPath } from "@/lib/media/storage";
import { deviceFromUserAgent, isSameOrigin, sanitizePlainText } from "@/lib/security/http";
import { rateLimit } from "@/lib/security/rate-limit";
import { scoreSpam, SPAM_THRESHOLD } from "@/lib/security/spam";
import { mintVisitorId, verifyVisitorId } from "@/lib/security/visitor";

describe("passwords", () => {
  it("hashes with scrypt and verifies", async () => {
    const hash = await hashPassword("a long passphrase");
    expect(hash.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("a long passphrase", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
    expect(await verifyPassword("x", "garbage")).toBe(false);
  });
});

describe("visitor ids", () => {
  it("round-trips and rejects tampering", async () => {
    const secret = "s".repeat(40);
    const v = await mintVisitorId(secret);
    expect(await verifyVisitorId(secret, v)).toMatch(/^[a-f0-9]{32}$/);
    expect(await verifyVisitorId(secret, v.replace(/.$/, (c) => (c === "a" ? "b" : "a")))).toBeNull();
    expect(await verifyVisitorId("other-secret".repeat(4), v)).toBeNull();
    expect(await verifyVisitorId(secret, "nonsense")).toBeNull();
  });
});

describe("rate limiting", () => {
  it("allows up to the limit inside a window, then blocks, then resets", () => {
    const now = 1_000_000;
    for (let i = 0; i < 3; i++) expect(rateLimit("k", 3, 1000, now).ok).toBe(true);
    const blocked = rateLimit("k", 3, 1000, now + 10);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
    expect(rateLimit("k", 3, 1000, now + 1001).ok).toBe(true);
  });
});

describe("spam heuristics", () => {
  it("flags link-stuffed promotional comments", () => {
    const v = scoreSpam({ name: "seo", content: "Buy backlinks http://a.test http://b.test http://c.test click here" });
    expect(v.score).toBeGreaterThanOrEqual(SPAM_THRESHOLD);
  });
  it("lets ordinary comments through", () => {
    expect(scoreSpam({ name: "Alex", content: "Great explanation of the KL term, thanks!" }).score).toBe(0);
  });
});

describe("plain-text sanitising", () => {
  it("removes control and bidi characters, collapses blank lines and truncates", () => {
    expect(sanitizePlainText("hi‮there\u0000\r\n\n\n\nok", 100)).toBe("hithere\n\nok");
    expect(sanitizePlainText("x".repeat(50), 10)).toHaveLength(10);
  });
});

describe("request helpers", () => {
  it("detects devices", () => {
    expect(deviceFromUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)")).toBe("mobile");
    expect(deviceFromUserAgent("Mozilla/5.0 (iPad; CPU OS 17_0)")).toBe("tablet");
    expect(deviceFromUserAgent("Googlebot/2.1")).toBe("bot");
    expect(deviceFromUserAgent("Mozilla/5.0 (Macintosh)")).toBe("desktop");
  });
  it("checks same-origin for CSRF", () => {
    const req = (origin: string | null) => new Request("http://site.test/api/x", { method: "POST", headers: { host: "site.test", ...(origin ? { origin } : {}) } });
    expect(isSameOrigin(req("http://site.test"))).toBe(true);
    expect(isSameOrigin(req("https://evil.test"))).toBe(false);
    expect(isSameOrigin(req(null))).toBe(false);
  });
});

describe("upload validation", () => {
  it("detects real types from magic bytes", () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
    expect(detectFileType(png)?.mime).toBe("image/png");
    const svg = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
    expect(detectFileType(svg)).toBeNull();
    const html = new TextEncoder().encode("<!doctype html><html><body>hi</body></html>");
    expect(detectFileType(html)).toBeNull();
  });
  it("refuses path traversal when serving media", () => {
    expect(resolveMediaPath(["blog", "a.png"])).not.toBeNull();
    expect(resolveMediaPath(["..", "portfolio.db"])).toBeNull();
    expect(resolveMediaPath(["blog", "..%2f.env"])).toBeNull();
    expect(resolveMediaPath(["blog", "x", "y.png"])).toBeNull();
  });
});
