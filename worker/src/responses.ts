import { BoardRecognitionSchema } from "../../shared/board-recognition-schema";
import type { BoardRecognitionResult } from "../../shared/board-recognition-schema";

const SYSTEM_PROMPT = `You transcribe a cropped chessboard photo into occupied squares.

Use image-relative coordinates only:
- imageRow 0 = top row, 7 = bottom row
- imageColumn 0 = left column, 7 = right column

Return every occupied square you can see. Skip empty squares.
If unsure about a piece, still include your best guess with lower confidence.
Do not infer captured pieces, turn, castling, or standard starting positions.
Estimate board orientation (white_at_bottom, black_at_bottom, or uncertain).
Mark unclear squares in ambiguousCells.

Prefer speed over perfect accuracy.`;

const USER_PROMPT =
  "List all occupied squares on this chessboard using imageRow and imageColumn. Be quick and approximate.";

export function validateRecognitionResult(
  result: BoardRecognitionResult,
): string | null {
  if (!result.boardDetected) {
    if (result.pieces.length > 0) return "Inconsistent board detection";
    return null;
  }
  const cells = new Set<string>();
  for (const p of result.pieces) {
    if (p.imageRow < 0 || p.imageRow > 7 || p.imageColumn < 0 || p.imageColumn > 7) {
      return "Invalid piece coordinates";
    }
    const key = `${p.imageRow},${p.imageColumn}`;
    if (cells.has(key)) return "Duplicate piece coordinates";
    cells.add(key);
  }
  if (result.pieces.length > 32) return "Too many pieces";
  return null;
}

export { SYSTEM_PROMPT, USER_PROMPT, BoardRecognitionSchema };
