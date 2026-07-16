import { Chessboard } from "react-chessboard";
import type { CSSProperties } from "react";
import type { BoardOrientation } from "../lib/types";
import { buildFen, defaultMeta } from "../lib/chess-position";
import type { PlacedPiece } from "../lib/types";

type Props = {
  pieces: PlacedPiece[];
  orientation: BoardOrientation;
  ambiguousSquares?: Set<string>;
  selectedSquare?: string | null;
  onSquareClick?: (square: string) => void;
  onPieceDrop?: (from: string, to: string) => boolean;
  boardOrientation?: "white" | "black";
};

export function ReviewChessboard({
  pieces,
  orientation,
  ambiguousSquares,
  selectedSquare,
  onSquareClick,
  onPieceDrop,
  boardOrientation,
}: Props) {
  const visual = boardOrientation ?? (orientation === "white_at_bottom" ? "white" : "black");
  const position = buildFen(pieces, defaultMeta("w"));

  const customSquareStyles: Record<string, CSSProperties> = {};
  ambiguousSquares?.forEach((sq) => {
    customSquareStyles[sq] = {
      boxShadow: "inset 0 0 0 3px rgba(234, 179, 8, 0.85)",
    };
  });
  if (selectedSquare) {
    customSquareStyles[selectedSquare] = {
      ...customSquareStyles[selectedSquare],
      backgroundColor: "rgba(16, 185, 129, 0.35)",
    };
  }

  return (
    <div className="w-full max-w-[min(100vw-2rem,480px)] mx-auto">
      <Chessboard
        options={{
          position,
          boardOrientation: visual,
          allowDragging: Boolean(onPieceDrop),
          onPieceDrop: ({ sourceSquare, targetSquare }) => {
            if (!onPieceDrop || !targetSquare) return false;
            return onPieceDrop(sourceSquare, targetSquare);
          },
          onSquareClick: ({ square }) => onSquareClick?.(square),
          squareStyles: customSquareStyles,
        }}
      />
    </div>
  );
}
