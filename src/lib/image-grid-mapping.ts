import type { BoardOrientation } from "./types";
import type { RecognizedPiece } from "./types";

/** Square name e.g. a8 */
/** Rotate image grid coordinates clockwise in 90° steps (for sideways board photos). */
export function rotateImageCell(
  imageRow: number,
  imageColumn: number,
  quarterTurnsClockwise: number,
): { imageRow: number; imageColumn: number } {
  let row = imageRow;
  let col = imageColumn;
  const turns = ((quarterTurnsClockwise % 4) + 4) % 4;
  for (let i = 0; i < turns; i++) {
    const nextRow = col;
    const nextCol = 7 - row;
    row = nextRow;
    col = nextCol;
  }
  return { imageRow: row, imageColumn: col };
}

export function imageCellToSquare(
  imageRow: number,
  imageColumn: number,
  orientation: BoardOrientation,
): string {
  if (orientation === "white_at_bottom") {
    const rank = 8 - imageRow;
    const file = String.fromCharCode("a".charCodeAt(0) + imageColumn);
    return `${file}${rank}`;
  }
  const rank = imageRow + 1;
  const file = String.fromCharCode("h".charCodeAt(0) - imageColumn);
  return `${file}${rank}`;
}

export function squareToImageCell(
  square: string,
  orientation: BoardOrientation,
): { imageRow: number; imageColumn: number } {
  const file = square.charCodeAt(0) - "a".charCodeAt(0);
  const rank = parseInt(square[1], 10);
  if (orientation === "white_at_bottom") {
    return { imageRow: 8 - rank, imageColumn: file };
  }
  return { imageRow: rank - 1, imageColumn: 7 - file };
}

export function orientationFromGuess(
  guess: "white_at_bottom" | "black_at_bottom" | "uncertain",
  userOverride?: BoardOrientation,
): BoardOrientation {
  if (userOverride) return userOverride;
  if (guess === "black_at_bottom") return "black_at_bottom";
  return "white_at_bottom";
}

export function validateImageCoordinates(pieces: RecognizedPiece[]): string | null {
  const seen = new Set<string>();
  for (const p of pieces) {
    if (p.imageRow < 0 || p.imageRow > 7 || p.imageColumn < 0 || p.imageColumn > 7) {
      return "Ugyldig bildekoordinat";
    }
    const key = `${p.imageRow},${p.imageColumn}`;
    if (seen.has(key)) return "Dupliserte bildekoordinater";
    seen.add(key);
  }
  return null;
}
