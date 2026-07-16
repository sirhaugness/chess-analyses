export type {
  BoardRecognitionResult,
  RecognizedPiece,
  PieceType,
  AnalyzeBoardRequest,
  AnalyzeBoardResponse,
} from "../../shared/board-recognition-schema.ts";

export type BoardOrientation = "white_at_bottom" | "black_at_bottom";

export type AppPhase =
  | "home"
  | "crop"
  | "analyze"
  | "review"
  | "analysis"
  | "position_edit";

export type CastlingRights = {
  whiteKingSide: boolean;
  whiteQueenSide: boolean;
  blackKingSide: boolean;
  blackQueenSide: boolean;
};

export type PositionMeta = {
  activeColor: "w" | "b";
  castling: CastlingRights;
};

export type PlacedPiece = {
  square: string;
  color: "w" | "b";
  type: "k" | "q" | "r" | "b" | "n" | "p";
};

export type ConfidenceLevel = "high" | "medium" | "low";
