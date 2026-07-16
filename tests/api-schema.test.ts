import { describe, expect, it } from "vitest";
import { AnalyzeBoardResponseSchema } from "../shared/board-recognition-schema";

describe("API response schema", () => {
  it("rejects invalid success payload", () => {
    const parsed = AnalyzeBoardResponseSchema.safeParse({
      success: true,
      result: { boardDetected: "yes" },
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts minimal valid failure", () => {
    const parsed = AnalyzeBoardResponseSchema.safeParse({
      success: false,
      error: { code: "x", message: "y" },
    });
    expect(parsed.success).toBe(true);
  });
});
