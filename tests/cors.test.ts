import { describe, expect, it } from "vitest";
import { isOriginAllowed, parseAllowedOrigins } from "../worker/src/cors";

describe("CORS origin", () => {
  it("parses allowed origins", () => {
    expect(parseAllowedOrigins("http://localhost:5173,https://foo.github.io")).toEqual([
      "http://localhost:5173",
      "https://foo.github.io",
    ]);
  });

  it("checks exact origin match", () => {
    const allowed = ["http://localhost:5173"];
    expect(isOriginAllowed("http://localhost:5173", allowed)).toBe(true);
    expect(isOriginAllowed("http://evil.com", allowed)).toBe(false);
  });
});
