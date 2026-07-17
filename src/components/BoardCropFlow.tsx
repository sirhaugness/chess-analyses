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
  const [detecting, setDetecting] = useState(false);
  const [corners, setCorners] = useState<OrderedCorners | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [sourceCanvas, setSourceCanvas] = useState<HTMLCanvasElement | null>(null);
  const [detectMessage, setDetectMessage] = useState<string | null>(null);
  const skipRef = useRef(false);

  const goManual = useCallback((message: string | null) => {
    setDetectMessage(message);
    setMode("manual");
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        await yieldToMain();
        const canvas = await loadOrientedImageCanvas(imageSrc);
        if (cancelled) return;
        setSourceCanvas(canvas);
        setImageSize({ width: canvas.width, height: canvas.height });
      } catch {
        if (!cancelled) {
          goManual("Kunne ikke laste bildet for auto-deteksjon. Bruk manuell beskjæring.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [imageSrc, goManual]);

  const runAutoDetection = useCallback(async () => {
    if (detecting) return;
    skipRef.current = false;
    setDetecting(true);
    setDetectMessage(null);

    try {
      await yieldToMain();
      const canvas = sourceCanvas ?? (await loadOrientedImageCanvas(imageSrc));
      if (skipRef.current) return;

      if (!sourceCanvas) {
        setSourceCanvas(canvas);
        setImageSize({ width: canvas.width, height: canvas.height });
      }

      const outcome = await withTimeout(
        detectChessboardFromCanvas(canvas, () => skipRef.current),
        DETECTION_TIMEOUT_MS,
      );
      if (skipRef.current) return;

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
      if (!skipRef.current) {
        goManual("Automatisk deteksjon feilet. Bruk manuell beskjæring.");
      }
    } finally {
      setDetecting(false);
    }
  }, [detecting, sourceCanvas, imageSrc, goManual]);

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
      <div className="relative z-20 mx-4 mt-4 space-y-2">
        {!detecting && !detectMessage && (
          <GlassCard className="flex flex-col gap-3 text-center">
            <p className="text-sm text-stone-200">
              Beskjær brettet manuelt nedenfor. Auto-deteksjon er valgfritt og kan ta noen sekunder.
            </p>
            <button
              type="button"
              className="min-h-11 w-full rounded-xl border border-emerald-400/50 bg-emerald-950/40 px-4 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-900/50"
              onClick={() => void runAutoDetection()}
            >
              Finn brett automatisk
            </button>
          </GlassCard>
        )}
        {detecting && (
          <GlassCard className="pointer-events-auto text-center">
            <div
              className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-emerald-400"
              aria-hidden
            />
            <p className="mt-3 text-sm font-medium text-stone-50">Finner sjakkbrettet …</p>
            <p className="mt-1 text-xs text-stone-400">
              Du kan hoppe over og bruke manuell beskjæring når som helst.
            </p>
            <button
              type="button"
              className="mt-4 min-h-11 w-full rounded-xl border border-white/40 bg-white/20 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-white/30"
              onClick={skipDetection}
            >
              Hopp over auto-deteksjon
            </button>
          </GlassCard>
        )}
        {detectMessage && !detecting && (
          <>
            <GlassAlert tone="amber">{detectMessage}</GlassAlert>
            {corners && confidence > 0 && (
              <button
                type="button"
                className="text-sm font-medium text-emerald-300 underline"
                onClick={() => setMode("auto")}
              >
                {shouldUseAutoCrop(confidence) ? "Bruk" : "Vis"} auto-forslag (
                {Math.round(confidence * 100)} % sikkerhet)
              </button>
            )}
            {!corners && (
              <SecondaryButton onClick={() => void runAutoDetection()}>
                Prøv auto-deteksjon igjen
              </SecondaryButton>
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
