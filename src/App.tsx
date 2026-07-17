import { useCallback, useRef, useState } from "react";
import type { AppPhase, BoardOrientation, BoardRecognitionResult, PlacedPiece, PositionMeta } from "./lib/types";
import { ImageSourcePicker } from "./components/ImageSourcePicker";
import { BoardCropFlow } from "./components/BoardCropFlow";
import { AnalysisLoading } from "./components/AnalysisLoading";
import { RecognitionReview } from "./components/RecognitionReview";
import { PositionEditor } from "./components/PositionEditor";
import { analyzeBoardImage } from "./lib/api";
import { prepareImageFromFile, validateImageFile } from "./lib/image-processing";
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
import { canEnterAnalysisMode, validatePositionForAnalysis } from "./lib/position-validation";
import { AppShell, GlassAlert, GlassCard, PrimaryButton } from "./components/AppShell";

function mapApiError(code: string, message: string): string {
  const map: Record<string, string> = {
    missing_api_url: "Manglende Worker-URL. Sett VITE_API_URL.",
    network_error: "Nettverksfeil. Sjekk tilkoblingen og prøv igjen.",
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
  const [preparingImage, setPreparingImage] = useState(false);
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [cropMeta, setCropMeta] = useState<{ kb: number } | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const analyzingRef = useRef(false);

  const [rawRecognition, setRawRecognition] = useState<BoardRecognitionResult | null>(null);
  const [orientation, setOrientation] = useState<BoardOrientation>("white_at_bottom");
  const [recognizedPieces, setRecognizedPieces] = useState<PlacedPiece[]>([]);
  const [confirmedPhotoPieces, setConfirmedPhotoPieces] = useState<PlacedPiece[]>([]);
  const [analysisStartPieces, setAnalysisStartPieces] = useState<PlacedPiece[]>([]);
  const [meta, setMeta] = useState<PositionMeta>(defaultMeta("w"));
  const [fenOpen, setFenOpen] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const analysis = useChessAnalysis(orientation);

  const startAnalysis = useCallback(
    (pieces: PlacedPiece[], orient: BoardOrientation = orientation) => {
      const issues = validatePositionForAnalysis(pieces, meta.activeColor);
      if (!canEnterAnalysisMode(issues)) {
        setAnalysisError("Stillingen er ugyldig og kan ikke brukes i analysemodus.");
        return false;
      }
      const fen = buildFen(pieces, meta);
      const err = analysis.loadNewStart(fen, orient);
      if (err) {
        setAnalysisError(err);
        return false;
      }
      setAnalysisError(null);
      return true;
    },
    [analysis, meta, orientation],
  );

  const handleFile = useCallback(async (file: File) => {
    const err = validateImageFile(file);
    if (err) {
      setHomeError(err);
      return;
    }
    setHomeError(null);
    setPreparingImage(true);
    try {
      const prepared = await prepareImageFromFile(file);
      setRawImage(prepared.dataUrl);
      setPhase("crop");
    } catch {
      setHomeError("Kunne ikke lese bildet.");
    } finally {
      setPreparingImage(false);
    }
  }, []);

  const runAnalyze = useCallback(async () => {
    if (!croppedImage || analyzingRef.current) return;
    analyzingRef.current = true;
    setAnalyzeError(null);
    setPhase("analyze");
    const res = await analyzeBoardImage({
      imageDataUrl: croppedImage,
    });
    analyzingRef.current = false;

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
    setConfirmedPhotoPieces(pieces);
    setAnalysisStartPieces(pieces);

    if (!startAnalysis(pieces, orient)) {
      setPhase("review");
      return;
    }
    setPhase("analysis");
  }, [croppedImage, startAnalysis]);

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
    if (!startAnalysis(recognizedPieces)) return;
    setPhase("analysis");
  };

  return (
    <AppShell>
      {phase === "home" && (
        <ImageSourcePicker
          onCamera={handleFile}
          onGallery={handleFile}
          error={homeError ?? undefined}
          busy={preparingImage}
        />
      )}

      {phase === "crop" && rawImage && (
        <>
          {croppedImage && (
            <GlassCard className="mx-4 mt-6">
              <img
                src={croppedImage}
                alt="Beskjært sjakkbrett"
                className="mx-auto mb-2 max-h-40 rounded-lg border border-white/20"
              />
              {cropMeta && (
                <p className="text-center text-xs text-stone-400">~{cropMeta.kb} KB</p>
              )}
              {analyzeError && (
                <div className="mt-3">
                  <GlassAlert tone="red">{analyzeError}</GlassAlert>
                </div>
              )}
              <PrimaryButton className="mt-4" disabled={!croppedImage} onClick={() => void runAnalyze()}>
                Analyser brettet
              </PrimaryButton>
            </GlassCard>
          )}
          {!croppedImage && (
            <BoardCropFlow
              key={rawImage}
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
            <div className="mx-4 pb-8 text-center">
              <button
                type="button"
                className="mt-2 text-sm text-stone-300 underline"
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
            if (!startAnalysis(pieces)) return;
            setPhase("analysis");
          }}
          onCancel={() => setPhase(confirmedPhotoPieces.length ? "analysis" : "review")}
          onRestorePhoto={() => {
            const photo = confirmedPhotoPieces.length ? confirmedPhotoPieces : recognizedPieces;
            setAnalysisStartPieces(photo);
            if (!startAnalysis(photo)) return;
            setPhase("analysis");
          }}
        />
      )}

      {phase === "analysis" && (
        <GlassCard className="mx-4 mt-4 flex flex-col gap-3 pb-36">
          {(analysisError || analysis.loadError) && (
            <GlassAlert tone="red">{analysisError ?? analysis.loadError}</GlassAlert>
          )}
          {!analysis.isReady ? (
            <p className="text-center text-sm text-stone-300">
              Ingen gyldig sjakkstilling er lastet. Gå tilbake og kontroller stillingen.
            </p>
          ) : (
            <>
          <p className="text-center font-medium text-stone-50">{analysis.statusText}</p>
          <ChessAnalysisBoard
            chess={analysis.chess}
            boardOrientation={analysis.boardOrientation}
            onTryMove={analysis.tryMove}
          />
          <MoveHistory moves={analysis.moveList} />
          <button
            type="button"
            className="text-sm text-stone-300 underline"
            onClick={() => setFenOpen((v) => !v)}
          >
            Stillingsdata {fenOpen ? "▲" : "▼"}
          </button>
          {fenOpen && (
            <div className="rounded-xl border border-white/15 bg-black/20 p-3 text-xs break-all text-stone-200">
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
                  startAnalysis(photo);
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
            </>
          )}
        </GlassCard>
      )}
    </AppShell>
  );
}
