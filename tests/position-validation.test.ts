import { describe, expect, it } from "vitest";
import { validatePositionForAnalysis, canEnterAnalysisMode } from "../src/lib/position-validation";
import { fenToPieces } from "../src/lib/chess-position";

describe("position validation", () => {
  it("detects missing kings", () => {
    const issues = validatePositionForAnalysis([], "w");
    expect(canEnterAnalysisMode(issues)).toBe(false);
    expect(issues.some((i) => i.message.includes("konge"))).toBe(true);
  });

  it("accepts valid start position", () => {
    const fen =
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    const pieces = fenToPieces(fen);
    const issues = validatePositionForAnalysis(pieces, "w");
    expect(canEnterAnalysisMode(issues)).toBe(true);
  });
});
