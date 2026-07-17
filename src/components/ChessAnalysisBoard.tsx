import { Chessboard } from "react-chessboard";
import type { CSSProperties } from "react";

type Props = {
  position: string;
  boardOrientation: "white" | "black";
  onTryMove: (from: string, to: string) => boolean;
  lastMove?: { from: string; to: string } | null;
};

export function ChessAnalysisBoard({
  position,
  boardOrientation,
  onTryMove,
  lastMove,
}: Props) {
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
          position,
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
