import { useEffect, useState } from "react";
import type { OrderedCorners } from "../lib/board-geometry";
import { shouldUseAutoCrop } from "../lib/board-geometry";
import { detectChessboard } from "../lib/board-auto-detect";
import { loadOrientedImageCanvas } from "../lib/perspective-export";
import { AutoBoardCropper } from "./AutoBoardCropper";
import { BoardImageCropper } from "./BoardImageCropper";

type Props = {
  imageSrc: string;
  onConfirm: (dataUrl: string, meta: { kb: number }) => void;
  onBack: () => void;
  onNewImage: () => void;
};

type Mode = "detecting" | "auto" | "manual";

export function BoardCropFlow({ imageSrc, onConfirm, onBack, onNewImage }: Props) {
  const [mode, setMode] = useState<Mode>("detecting");
  const [corners, setCorners] = useState<OrderedCorners | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [detectMessage, setDetectMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const canvas = await loadOrientedImageCanvas(imageSrc);
        if (cancelled) return;
        setImageSize({ width: canvas.width, height: canvas.height });

        const result = await detectChessboard(imageSrc);
        if (cancelled) return;

        if (result && shouldUseAutoCrop(result.confidence)) {
          setCorners(result.corners);
          setConfidence(result.confidence);
          setMode("auto");
          return;
        }

        if (result) {
          setDetectMessage(
            "Vi er usikre på brettets hjørner. Manuell beskjæring er åpnet — du kan også prøve auto-forslaget.",
          );
          setCorners(result.corners);
          setConfidence(result.confidence);
        } else {
          setDetectMessage(
            "Fant ikke sjakkbrettet automatisk. Bruk manuell beskjæring og plasser hele brettet i rammen.",
          );
        }
        setMode("manual");
      } catch {
        if (!cancelled) {
          setDetectMessage("Automatisk deteksjon feilet. Bruk manuell beskjæring.");
          setMode("manual");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [imageSrc]);

  if (mode === "detecting") {
    return (
      <section className="mx-auto flex max-w-lg flex-col items-center gap-4 px-4 py-16 text-center">
        <div
          className="h-10 w-10 animate-spin rounded-full border-4 border-stone-200 border-t-emerald-700"
          aria-hidden
        />
        <p className="text-lg font-medium text-stone-800">Finner sjakkbrettet …</p>
        <p className="text-sm text-stone-600">Analyserer bildet lokalt i nettleseren.</p>
      </section>
    );
  }

  if (mode === "auto" && corners && imageSize.width > 0) {
    return (
      <AutoBoardCropper
        imageSrc={imageSrc}
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
      {detectMessage && (
        <div className="mx-auto max-w-lg px-4 pt-4">
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            {detectMessage}
          </p>
          {corners && confidence > 0 && (
            <button
              type="button"
              className="mt-2 text-sm font-medium text-emerald-800 underline"
              onClick={() => setMode("auto")}
            >
              Vis auto-forslag ({Math.round(confidence * 100)} % sikkerhet)
            </button>
          )}
        </div>
      )}
      <BoardImageCropper
        imageSrc={imageSrc}
        onConfirm={onConfirm}
        onBack={onBack}
        onNewImage={onNewImage}
      />
    </>
  );
}
