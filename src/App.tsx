import { useCallback, useMemo, useRef, useState } from "react";
import type { AppPhase, BoardOrientation, BoardRecognitionResult, PlacedPiece, PositionMeta } from "./lib/types";
import { ImageSourcePicker } from "./components/ImageSourcePicker";
import { BoardImageCropper } from "./components/BoardImageCropper";
import { AnalysisLoading } from "./components/AnalysisLoading";
import { RecognitionReview } from "./components/RecognitionReview";
import { PositionEditor } from "./components/PositionEditor";
import { TurnstileWidget } from "./components/TurnstileWidget";
import { analyzeBoardImage } from "./lib/api";
import { readFileAsDataUrl, validateImageFile } from "./lib/image-processing";
import {
  buildFen,
  defaultMeta,
  copyFenToClipboard,
} from "./lib/chess-position";
import {
  guessToOrientation,
  piecesFromRecognition,
  useChessAnalysis,
} from "./hooks/useChessAnalysis";
import { ChessAnalysisBoard } from "./components/ChessAnalysisBoard";
import { MoveHistory } from "./components/MoveHistory";
import { PromotionDialog } from "./components/PromotionDialog";
import { BoardControls } from "./components/BoardControls";

function mapApiError(code: string, message: string): string {
  const map: Record<string, string> = {
    missing_api_url: "Manglende Worker-URL. Sett VITE_API_URL.",
    network_error: "Nettverksfeil. Sjekk tilkoblingen og prøv igjen.",
    invalid_turnstile: "Ugyldig sikkerhetskontroll. Prøv igjen.",
    origin_not_allowed: "Ikke-tillatt origin.",
    payload_too_large: "For stor request.",
    rate_limit: "OpenAI rate limit. Vent litt og prøv igjen.",
    openai_timeout: "OpenAI timeout. Prøv igjen.",
    invalid_image: "Ugyldig bilde.",
    board_not_found: "Sjakkbrett ikke funnet.",
    server_misconfigured: "Manglende API-konfigurasjon på serveren.",
    server_error: "Generell serverfeil.",
  };
  return map[code] ?? message;
}

export default function App() {
  const [phase, setPhase] = useState<AppPhase>("home");
  const [homeError, setHomeError] = useState<string | null>(null);
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [cropMeta, setCropMeta] = useState<{ kb: number } | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileReset, setTurnstileReset] = useState(0);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const analyzingRef = useRef(false);

  const [rawRecognition, setRawRecognition] = useState<BoardRecognitionResult | null>(null);
  const [orientation, setOrientation] = useState<BoardOrientation>("white_at_bottom");
  const [recognizedPieces, setRecognizedPieces] = useState<PlacedPiece[]>([]);
  const [confirmedPhotoPieces, setConfirmedPhotoPieces] = useState<PlacedPiece[]>([]);
  const [analysisStartPieces, setAnalysisStartPieces] = useState<PlacedPiece[]>([]);
  const [meta, setMeta] = useState<PositionMeta>(defaultMeta("w"));
  const [fenOpen, setFenOpen] = useState(false);

  const analysisFen = useMemo(
    () => buildFen(analysisStartPieces, meta),
    [analysisStartPieces, meta],
  );

  const analysis = useChessAnalysis(analysisFen, orientation);

  const handleFile = useCallback(async (file: File) => {
    const err = validateImageFile(file);
    if (err) {
      setHomeError(err);
      return;
    }
    setHomeError(null);
    try {
      const url = await readFileAsDataUrl(file);
      setRawImage(url);
      setPhase("crop");
    } catch {
      setHomeError("Kunne ikke lese bildet.");
    }
  }, []);

  const runAnalyze = useCallback(async () => {
    if (!croppedImage || analyzingRef.current) return;
    analyzingRef.current = true;
    setAnalyzeError(null);
    setPhase("analyze");
    const res = await analyzeBoardImage({
      imageDataUrl: croppedImage,
      turnstileToken,
    });
    analyzingRef.current = false;
    setTurnstileReset((k) => k + 1);
    setTurnstileToken("");

    if (!res.success) {
      setAnalyzeError(mapApiError(res.error.code, res.error.message));
      setPhase("crop");
      return;
    }

    const result = res.result;
    if (!result.boardDetected) {
      setAnalyzeError(
        result.warnings[0] ?? "Sjakkbrett ikke funnet. Prøv et nytt bilde med hele brettet synlig.",
      );
      setPhase("crop");
      return;
    }
    if (!result.boardFullyVisible) {
      setAnalyzeError("Kun deler av brettet er synlig. Beskjær på nytt.");
      setPhase("crop");
      return;
    }

    const orient = guessToOrientation(result.orientationGuess);
    const pieces = piecesFromRecognition(result, orient);
    setRawRecognition(result);
    setOrientation(orient);
    setRecognizedPieces(pieces);
    setPhase("review");
  }, [croppedImage, turnstileToken]);

  const restoreRecognition = () => {
    if (!rawRecognition) return;
    setRecognizedPieces(piecesFromRecognition(rawRecognition, orientation));
  };

  const onOrientationChange = (o: BoardOrientation) => {
    setOrientation(o);
    if (rawRecognition) {
      setRecognizedPieces(piecesFromRecognition(rawRecognition, o));
    }
  };

  const confirmReview = () => {
    setConfirmedPhotoPieces(recognizedPieces);
    setAnalysisStartPieces(recognizedPieces);
    analysis.loadNewStart(buildFen(recognizedPieces, meta), orientation);
    setPhase("analysis");
  };

  return (
    <div className="min-h-dvh bg-stone-100 text-stone-900">
      {phase === "home" && (
        <ImageSourcePicker
          onCamera={handleFile}
          onGallery={handleFile}
          error={homeError ?? undefined}
        />
      )}

      {phase === "crop" && rawImage && (
        <>
          {croppedImage && (
            <section className="mx-auto max-w-lg px-4 pt-6">
              <img
                src={croppedImage}
                alt="Beskjært sjakkbrett"
                className="mx-auto mb-2 max-h-40 rounded-lg border"
              />
              {cropMeta && (
                <p className="text-center text-xs text-stone-500">~{cropMeta.kb} KB</p>
              )}
              <TurnstileWidget
                resetKey={turnstileReset}
                onToken={setTurnstileToken}
                onError={() => setAnalyzeError("Ugyldig sikkerhetskontroll.")}
              />
              {analyzeError && <p className="mt-2 text-sm text-red-700">{analyzeError}</p>}
              <button
                type="button"
                className="mt-4 min-h-12 w-full rounded-xl bg-emerald-700 font-medium text-white disabled:opacity-50"
                disabled={!croppedImage}
                onClick={() => void runAnalyze()}
              >
                Analyser brettet
              </button>
            </section>
          )}
          {!croppedImage && (
            <BoardImageCropper
              imageSrc={rawImage}
              onConfirm={(dataUrl, metaKb) => {
                setCroppedImage(dataUrl);
                setCropMeta(metaKb);
              }}
              onBack={() => setPhase("home")}
              onNewImage={() => {
                setRawImage(null);
                setCroppedImage(null);
                setPhase("home");
              }}
            />
          )}
          {croppedImage && (
            <div className="mx-auto max-w-lg px-4 pb-8">
              <button
                type="button"
                className="mt-2 text-sm text-stone-600 underline"
                onClick={() => {
                  setCroppedImage(null);
                  setCropMeta(null);
                }}
              >
                Juster utsnitt
              </button>
            </div>
          )}
        </>
      )}

      {phase === "analyze" && <AnalysisLoading />}

      {phase === "review" && rawRecognition && (
        <RecognitionReview
          result={rawRecognition}
          pieces={recognizedPieces}
          orientation={orientation}
          onPiecesChange={setRecognizedPieces}
          onOrientationChange={onOrientationChange}
          onRestoreRecognition={restoreRecognition}
          onClearBoard={() => setRecognizedPieces([])}
          meta={meta}
          onMetaChange={setMeta}
          onConfirm={confirmReview}
          onFreeEdit={() => setPhase("position_edit")}
        />
      )}

      {phase === "position_edit" && (
        <PositionEditor
          initialPieces={analysisStartPieces.length ? analysisStartPieces : recognizedPieces}
          orientation={orientation}
          meta={meta}
          photoPieces={confirmedPhotoPieces.length ? confirmedPhotoPieces : recognizedPieces}
          onSaveAsAnalysisStart={(pieces) => {
            setAnalysisStartPieces(pieces);
            analysis.loadNewStart(buildFen(pieces, meta), orientation);
            setPhase("analysis");
          }}
          onCancel={() => setPhase(confirmedPhotoPieces.length ? "analysis" : "review")}
          onRestorePhoto={() => {
            const photo = confirmedPhotoPieces.length ? confirmedPhotoPieces : recognizedPieces;
            setAnalysisStartPieces(photo);
            analysis.loadNewStart(buildFen(photo, meta), orientation);
            setPhase("analysis");
          }}
        />
      )}

      {phase === "analysis" && (
        <section className="mx-auto flex max-w-lg flex-col gap-3 px-4 py-4 pb-36">
          <p className="text-center font-medium">{analysis.statusText}</p>
          <ChessAnalysisBoard
            chess={analysis.chess}
            boardOrientation={analysis.boardOrientation}
            onTryMove={analysis.tryMove}
          />
          <MoveHistory moves={analysis.moveList} />
          <button
            type="button"
            className="text-sm text-stone-600 underline"
            onClick={() => setFenOpen((v) => !v)}
          >
            Stillingsdata {fenOpen ? "▲" : "▼"}
          </button>
          {fenOpen && (
            <div className="rounded-xl bg-white p-3 text-xs break-all">
              <p>{analysis.fen}</p>
              <button
                type="button"
                className="mt-2 underline"
                onClick={() => void copyFenToClipboard(analysis.fen)}
              >
                Kopier FEN
              </button>
            </div>
          )}
          {analysis.promotionPending && (
            <PromotionDialog
              onQueen={() => analysis.completePromotion("q")}
              onRook={() => analysis.completePromotion("r")}
              onBishop={() => analysis.completePromotion("b")}
              onKnight={() => analysis.completePromotion("n")}
            />
          )}
          <BoardControls>
            <div className="grid grid-cols-2 gap-2">
              <BoardControls.Secondary onClick={analysis.undo} disabled={!analysis.canUndo}>
                Angre
              </BoardControls.Secondary>
              <BoardControls.Secondary onClick={analysis.redo} disabled={!analysis.canRedo}>
                Gjør om
              </BoardControls.Secondary>
              <BoardControls.Secondary onClick={analysis.resetToStart}>
                Start varianten på nytt
              </BoardControls.Secondary>
              <BoardControls.Secondary
                onClick={() => {
                  const photo = confirmedPhotoPieces;
                  setAnalysisStartPieces(photo);
                  analysis.loadNewStart(buildFen(photo, meta), orientation);
                }}
              >
                Tilbake til bildestillingen
              </BoardControls.Secondary>
              <BoardControls.Secondary onClick={() => setPhase("position_edit")}>
                Rediger stillingen
              </BoardControls.Secondary>
              <BoardControls.Secondary onClick={analysis.flipBoard}>
                Snu brettet
              </BoardControls.Secondary>
            </div>
            <BoardControls.Primary
              onClick={() => {
                setPhase("home");
                setRawImage(null);
                setCroppedImage(null);
                setRawRecognition(null);
              }}
            >
              Nytt bilde
            </BoardControls.Primary>
          </BoardControls>
        </section>
      )}
    </div>
  );
}
