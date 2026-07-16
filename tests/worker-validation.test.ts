import { describe, expect, it } from "vitest";
import { validateRecognitionResult } from "../worker/src/responses";

describe("validateRecognitionResult", () => {
  it("rejects duplicate cells", () => {
    const err = validateRecognitionResult({
      boardDetected: true,
      boardFullyVisible: true,
      orientationGuess: "white_at_bottom",
      overallConfidence: 0.9,
      pieces: [
        {
          imageRow: 1,
          imageColumn: 1,
          color: "white",
          type: "pawn",
          confidence: 0.9,
        },
        {
          imageRow: 1,
          imageColumn: 1,
          color: "black",
          type: "pawn",
          confidence: 0.9,
        },
      ],
      ambiguousCells: [],
      warnings: [],
    });
    expect(err).toBe("Duplicate piece coordinates");
  });
});
