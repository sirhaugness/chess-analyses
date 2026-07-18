import { describe, expect, it } from "vitest";
import {
  imageCellToSquare,
  rotateImageCell,
  validateImageCoordinates,
} from "../src/lib/image-grid-mapping";
import {
  buildFen,
  buildPiecePlacement,
  defaultMeta,
  fenToPieces,
} from "../src/lib/chess-position";
import type { RecognizedPiece } from "../shared/board-recognition-schema";

describe("rotateImageCell", () => {
  it("maps corners correctly for 90° clockwise steps", () => {
    expect(rotateImageCell(0, 0, 0)).toEqual({ imageRow: 0, imageColumn: 0 });
    expect(rotateImageCell(0, 0, 1)).toEqual({ imageRow: 0, imageColumn: 7 });
    expect(rotateImageCell(0, 0, 2)).toEqual({ imageRow: 7, imageColumn: 7 });
    expect(rotateImageCell(0, 0, 3)).toEqual({ imageRow: 7, imageColumn: 0 });
    expect(rotateImageCell(2, 5, 4)).toEqual(rotateImageCell(2, 5, 0));
  });

  it("changes mapped square when board photo is sideways", () => {
    const before = imageCellToSquare(0, 0, "white_at_bottom");
    const rotated = rotateImageCell(0, 0, 1);
    const after = imageCellToSquare(rotated.imageRow, rotated.imageColumn, "white_at_bottom");
    expect(before).toBe("a8");
    expect(after).not.toBe(before);
  });
});

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
