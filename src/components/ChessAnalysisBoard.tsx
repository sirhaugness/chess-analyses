import { Chessboard } from "react-chessboard";
import type { Chess, Square } from "chess.js";

type Props = {
  chess: Chess;
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
  const squareStyles: Record<string, React.CSSProperties> = {};
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
            if (!targetSquare) return false;
            const from = sourceSquare as Square;
            const to = targetSquare as Square;
            const moves = chess.moves({ square: from, verbose: true });
            const legal = moves.some((m) => m.to === to);
            if (!legal) return false;
            return onTryMove(sourceSquare, targetSquare);
          },
          squareStyles,
        }}
      />
    </div>
  );
}
