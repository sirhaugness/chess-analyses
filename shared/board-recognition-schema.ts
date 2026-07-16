import { z } from "zod";

export const PieceTypeSchema = z.enum([
  "king",
  "queen",
  "rook",
  "bishop",
  "knight",
  "pawn",
]);

export const OrientationGuessSchema = z.enum([
  "white_at_bottom",
  "black_at_bottom",
  "uncertain",
]);

export const RecognizedPieceSchema = z.object({
  imageRow: z.number().int().min(0).max(7),
  imageColumn: z.number().int().min(0).max(7),
  color: z.enum(["white", "black"]),
  type: PieceTypeSchema,
  confidence: z.number().min(0).max(1),
});

export const AmbiguousCellSchema = z.object({
  imageRow: z.number().int().min(0).max(7),
  imageColumn: z.number().int().min(0).max(7),
  reason: z.string().max(200),
});

export const BoardRecognitionSchema = z.object({
  boardDetected: z.boolean(),
  boardFullyVisible: z.boolean(),
  orientationGuess: OrientationGuessSchema,
  overallConfidence: z.number().min(0).max(1),
  pieces: z.array(RecognizedPieceSchema).max(32),
  ambiguousCells: z.array(AmbiguousCellSchema).max(64),
  warnings: z.array(z.string().max(300)).max(20),
});

export type PieceType = z.infer<typeof PieceTypeSchema>;
export type BoardRecognitionResult = z.infer<typeof BoardRecognitionSchema>;
export type RecognizedPiece = z.infer<typeof RecognizedPieceSchema>;

export type AnalyzeBoardResponse =
  | {
      success: true;
      result: BoardRecognitionResult;
    }
  | {
      success: false;
      error: {
        code: string;
        message: string;
      };
    };

export type AnalyzeBoardRequest = {
  imageDataUrl: string;
  turnstileToken: string;
};

export const AnalyzeBoardErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

export const AnalyzeBoardSuccessSchema = z.object({
  success: z.literal(true),
  result: BoardRecognitionSchema,
});

export const AnalyzeBoardResponseSchema = z.discriminatedUnion("success", [
  AnalyzeBoardSuccessSchema,
  AnalyzeBoardErrorSchema,
]);
