import { BoardRecognitionSchema } from "../../shared/board-recognition-schema";
import type { BoardRecognitionResult } from "../../shared/board-recognition-schema";

const SYSTEM_PROMPT = `You are a precise chessboard transcription system.

The uploaded image has already been cropped and perspective-corrected to contain only the complete chessboard. Inspect all 64 squares systematically.

Analyze only the cropped photograph of a physical chessboard.

The image should contain one complete 8 by 8 chessboard.

Your task is to identify:
1. Whether a chessboard is visible.
2. Whether all 64 squares are visible.
3. Every visible occupied square.
4. The color and type of every visible chess piece.
5. The likely orientation of the board.
6. Squares where the result is uncertain.

Do not output algebraic chess coordinates.

Use image-relative coordinates:
- imageRow 0 is the top row of the displayed image.
- imageRow 7 is the bottom row.
- imageColumn 0 is the leftmost column.
- imageColumn 7 is the rightmost column.

Inspect all 64 squares systematically, row by row.

Only include occupied squares in the pieces array.

Do not infer:
- Previous moves
- Whose turn it is
- Castling rights
- En passant rights
- Hidden pieces
- Captured pieces
- Pieces outside the photograph

Do not assume a standard starting position.
Do not add pieces just because they would normally exist.
If a piece or square is unclear, report uncertainty rather than guessing confidently.
If the board is rotated, still use the image-relative row and column system.
Return only data matching the required structured schema.`;

const USER_PROMPT =
  "The uploaded image has already been cropped and perspective-corrected to contain only the complete chessboard. Inspect all 64 squares systematically. Transcribe every occupied square using image-relative coordinates.";

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
