import { describe, expect, it } from "vitest";
import { imageCellToSquare, validateImageCoordinates } from "../src/lib/image-grid-mapping";
import {
  buildFen,
  buildPiecePlacement,
  defaultMeta,
  fenToPieces,
} from "../src/lib/chess-position";
import type { RecognizedPiece } from "../shared/board-recognition-schema";

describe("image grid mapping white at bottom", () => {
  it("maps top-left to a8 and bottom-right to h1", () => {
    expect(imageCellToSquare(0, 0, "white_at_bottom")).toBe("a8");
    expect(imageCellToSquare(7, 7, "white_at_bottom")).toBe("h1");
  });
});

describe("image grid mapping black at bottom", () => {
  it("maps top-left to h1 and bottom-right to a8", () => {
    expect(imageCellToSquare(0, 0, "black_at_bottom")).toBe("h1");
    expect(imageCellToSquare(7, 7, "black_at_bottom")).toBe("a8");
  });
});

describe("piece list to FEN", () => {
  it("builds standard start placement", () => {
    const fen =
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    const pieces = fenToPieces(fen);
    const placement = buildPiecePlacement(pieces);
    expect(placement).toBe("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR");
    const full = buildFen(pieces, defaultMeta("w"));
    expect(full.split(" ")[0]).toBe(placement);
  });
});

describe("validateImageCoordinates", () => {
  it("rejects duplicate coordinates", () => {
    const pieces: RecognizedPiece[] = [
      {
        imageRow: 0,
        imageColumn: 0,
        color: "white",
        type: "pawn",
        confidence: 0.9,
      },
      {
        imageRow: 0,
        imageColumn: 0,
        color: "black",
        type: "pawn",
        confidence: 0.9,
      },
    ];
    expect(validateImageCoordinates(pieces)).toBe("Dupliserte bildekoordinater");
  });

  it("rejects invalid row", () => {
    const pieces: RecognizedPiece[] = [
      {
        imageRow: 8,
        imageColumn: 0,
        color: "white",
        type: "pawn",
        confidence: 0.9,
      },
    ];
    expect(validateImageCoordinates(pieces)).toBe("Ugyldig bildekoordinat");
  });
});
