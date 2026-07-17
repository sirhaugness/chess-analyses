import { Chessboard } from "react-chessboard";
import type { CSSProperties } from "react";
import type { Chess } from "chess.js";

type Props = {
  chess: Chess | null;
  boardOrientation: "white" | "black";
  onTryMove: (from: string, to: string) => boolean;
  lastMove?: { from: string; to: string } | null;
};

export function ChessAnalysisBoard({
  chess,
  boardOrientation,
  onTryMove,
  lastMove,
}: Props) {
  if (!chess) {
    return (
      <p className="text-center text-sm text-stone-600">
        Ingen gyldig sjakkstilling er lastet.
      </p>
    );
  }

  const squareStyles: Record<string, CSSProperties> = {};
  if (lastMove) {
    for (const sq of [lastMove.from, lastMove.to]) {
      squareStyles[sq] = { backgroundColor: "rgba(155, 199, 0, 0.41)" };
    }
  }

  return (
    <div className="w-full max-w-[min(100vw-2rem,480px)] mx-auto">
      <Chessboard
        options={{
          position: chess.fen(),
          boardOrientation,
          allowDragging: true,
          onPieceDrop: ({ sourceSquare, targetSquare }) => {
            if (!targetSquare || sourceSquare === targetSquare) return false;
            return onTryMove(sourceSquare, targetSquare);
          },
          squareStyles,
        }}
      />
    </div>
  );
}
