import { useCallback, useEffect, useRef, useState } from "react";
import type { OrderedCorners } from "../lib/board-geometry";
import { shouldUseAutoCrop } from "../lib/board-geometry";
import { detectChessboardFromCanvas } from "../lib/board-auto-detect";
import { loadOrientedImageCanvas } from "../lib/perspective-export";
import { DETECTION_TIMEOUT_MS, withTimeout, yieldToMain } from "../lib/async-utils";
import { AutoBoardCropper } from "./AutoBoardCropper";
import { BoardImageCropper } from "./BoardImageCropper";
import { GlassAlert, GlassCard, SecondaryButton } from "./AppShell";

type Props = {
  imageSrc: string;
  onConfirm: (dataUrl: string, meta: { kb: number }) => void;
  onBack: () => void;
  onNewImage: () => void;
};

type Mode = "manual" | "auto";

export function BoardCropFlow({ imageSrc, onConfirm, onBack, onNewImage }: Props) {
  const [mode, setMode] = useState<Mode>("manual");
  const [detecting, setDetecting] = useState(true);
  const [corners, setCorners] = useState<OrderedCorners | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [sourceCanvas, setSourceCanvas] = useState<HTMLCanvasElement | null>(null);
  const [detectMessage, setDetectMessage] = useState<string | null>(null);
  const skipRef = useRef(false);

  const goManual = useCallback((message: string) => {
    setDetectMessage(message);
    setMode("manual");
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        await yieldToMain();
        const canvas = await loadOrientedImageCanvas(imageSrc);
        if (cancelled || skipRef.current) {
          setDetecting(false);
          return;
        }

        setSourceCanvas(canvas);
        setImageSize({ width: canvas.width, height: canvas.height });

        const outcome = await withTimeout(
          detectChessboardFromCanvas(canvas),
          DETECTION_TIMEOUT_MS,
        );
        if (cancelled || skipRef.current) {
          setDetecting(false);
          return;
        }

        setDetecting(false);

        if (outcome === "timeout") {
          goManual("Fant ikke brettet raskt nok — bruk manuell beskjæring.");
          return;
        }

        if (outcome && shouldUseAutoCrop(outcome.confidence)) {
          setCorners(outcome.corners);
          setConfidence(outcome.confidence);
          setDetectMessage(
            `Fant brettet (${Math.round(outcome.confidence * 100)} % sikkerhet). Du kan bruke auto-forslaget eller beskjære manuelt.`,
          );
          return;
        }

        if (outcome) {
          setCorners(outcome.corners);
          setConfidence(outcome.confidence);
          goManual(
            "Vi er usikre på brettets hjørner. Manuell beskjæring er åpnet — du kan også prøve auto-forslaget.",
          );
          return;
        }

        goManual(
          "Fant ikke sjakkbrettet automatisk. Bruk manuell beskjæring og plasser hele brettet i rammen.",
        );
      } catch {
        if (!cancelled && !skipRef.current) {
          setDetecting(false);
          goManual("Automatisk deteksjon feilet. Bruk manuell beskjæring.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [imageSrc, goManual]);

  const skipDetection = () => {
    skipRef.current = true;
    setDetecting(false);
    goManual("Auto-deteksjon hoppet over. Bruk manuell beskjæring.");
  };

  if (mode === "auto" && corners && imageSize.width > 0) {
    return (
      <AutoBoardCropper
        imageSrc={imageSrc}
        sourceCanvas={sourceCanvas}
        imageWidth={imageSize.width}
        imageHeight={imageSize.height}
        initialCorners={corners}
        confidence={confidence}
        onConfirm={onConfirm}
        onManualCrop={() => setMode("manual")}
        onBack={onBack}
        onNewImage={onNewImage}
      />
    );
  }

  return (
    <>
      <div className="mx-4 mt-4 space-y-2">
        {detecting && (
          <GlassCard className="text-center">
            <div
              className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-emerald-400"
              aria-hidden
            />
            <p className="mt-3 text-sm font-medium text-stone-50">Finner sjakkbrettet …</p>
            <p className="mt-1 text-xs text-stone-400">
              Manuell beskjæring er tilgjengelig mens vi søker.
            </p>
            <SecondaryButton className="mt-4" onClick={skipDetection}>
              Hopp over auto-deteksjon
            </SecondaryButton>
          </GlassCard>
        )}
        {detectMessage && !detecting && (
          <>
            <GlassAlert tone="amber">{detectMessage}</GlassAlert>
            {corners && confidence > 0 && shouldUseAutoCrop(confidence) && (
              <button
                type="button"
                className="text-sm font-medium text-emerald-300 underline"
                onClick={() => setMode("auto")}
              >
                Bruk auto-forslag ({Math.round(confidence * 100)} % sikkerhet)
              </button>
            )}
            {corners && confidence > 0 && !shouldUseAutoCrop(confidence) && (
              <button
                type="button"
                className="text-sm font-medium text-emerald-300 underline"
                onClick={() => setMode("auto")}
              >
                Vis auto-forslag ({Math.round(confidence * 100)} % sikkerhet)
              </button>
            )}
          </>
        )}
      </div>
      <BoardImageCropper
        imageSrc={imageSrc}
        onConfirm={onConfirm}
        onBack={onBack}
        onNewImage={onNewImage}
      />
    </>
  );
}

export { DETECTION_TIMEOUT_MS };
