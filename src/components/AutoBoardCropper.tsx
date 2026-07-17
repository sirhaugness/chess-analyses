import { useCallback, useRef, useState } from "react";
import type { OrderedCorners, Point } from "../lib/board-geometry";
import {
  clampCorner,
  orderedCornersToArray,
} from "../lib/board-geometry";
import { exportBoardFromCorners } from "../lib/perspective-export";

type CornerKey = keyof OrderedCorners;

const CORNER_KEYS: CornerKey[] = ["topLeft", "topRight", "bottomRight", "bottomLeft"];

type Props = {
  imageSrc: string;
  imageWidth: number;
  imageHeight: number;
  initialCorners: OrderedCorners;
  confidence: number;
  onConfirm: (dataUrl: string, meta: { kb: number }) => void;
  onManualCrop: () => void;
  onBack: () => void;
  onNewImage: () => void;
};

export function AutoBoardCropper({
  imageSrc,
  imageWidth,
  imageHeight,
  initialCorners,
  confidence,
  onConfirm,
  onManualCrop,
  onBack,
  onNewImage,
}: Props) {
  const [corners, setCorners] = useState<OrderedCorners>(initialCorners);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewKb, setPreviewKb] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<CornerKey | null>(null);

  const displayToImage = useCallback(
    (clientX: number, clientY: number): Point | null => {
      const el = containerRef.current;
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      const relX = (clientX - rect.left) / rect.width;
      const relY = (clientY - rect.top) / rect.height;
      return clampCorner(
        { x: relX * imageWidth, y: relY * imageHeight },
        imageWidth,
        imageHeight,
      );
    },
    [imageWidth, imageHeight],
  );

  const imageToDisplay = useCallback(
    (p: Point): { x: number; y: number } => ({
      x: (p.x / imageWidth) * 100,
      y: (p.y / imageHeight) * 100,
    }),
    [imageWidth, imageHeight],
  );

  const onPointerDown = (key: CornerKey) => (e: React.PointerEvent) => {
    draggingRef.current = key;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const key = draggingRef.current;
    if (!key) return;
    const pt = displayToImage(e.clientX, e.clientY);
    if (!pt) return;
    setCorners((c) => ({ ...c, [key]: pt }));
  };

  const onPointerUp = () => {
    draggingRef.current = null;
  };

  const handleConfirm = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await exportBoardFromCorners(imageSrc, corners);
      setPreviewKb(result.approximateSizeKb);
      onConfirm(result.dataUrl, { kb: result.approximateSizeKb });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunne ikke behandle bildet.");
    } finally {
      setBusy(false);
    }
  };

  const polyline = orderedCornersToArray(corners)
    .map((p) => {
      const d = imageToDisplay(p);
      return `${d.x},${d.y}`;
    })
    .join(" ");

  return (
    <section className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-6">
      <h2 className="text-xl font-semibold text-stone-900">Foreslått utsnitt</h2>
      <p className="text-sm text-stone-600">
        Dra hjørnepunktene dersom utsnittet ikke stemmer. Brettet rettes opp til et kvadrat før
        analyse.
      </p>
      <p className="text-xs text-stone-500">
        Sikkerhet for auto-deteksjon: {Math.round(confidence * 100)} %
      </p>

      <div
        ref={containerRef}
        className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-stone-900 touch-none"
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <img
          src={imageSrc}
          alt="Originalbilde"
          className="h-full w-full object-contain"
          draggable={false}
        />
        <svg className="absolute inset-0 h-full w-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polygon
            points={polyline}
            fill="rgba(16, 185, 129, 0.12)"
            stroke="rgb(16, 185, 129)"
            strokeWidth="0.6"
          />
        </svg>
        {CORNER_KEYS.map((key) => {
          const d = imageToDisplay(corners[key]);
          return (
            <button
              key={key}
              type="button"
              aria-label={key}
              className="absolute z-10 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-emerald-600 shadow"
              style={{ left: `${d.x}%`, top: `${d.y}%` }}
              onPointerDown={onPointerDown(key)}
            />
          );
        })}
      </div>

      {previewKb !== null && (
        <p className="text-xs text-stone-500">Eksportert bilde: ~{previewKb} KB</p>
      )}
      {error && <p className="text-sm text-red-700">{error}</p>}

      <div className="flex flex-col gap-2">
        <button
          type="button"
          disabled={busy}
          className="min-h-12 rounded-xl bg-emerald-700 px-4 py-3 font-medium text-white disabled:opacity-60"
          onClick={() => void handleConfirm()}
        >
          Bruk dette utsnittet
        </button>
        <button
          type="button"
          className="min-h-11 rounded-xl border border-stone-300 bg-white py-2 font-medium"
          onClick={onManualCrop}
        >
          Juster utsnitt (manuell)
        </button>
        <button
          type="button"
          className="min-h-11 rounded-xl border border-stone-300 bg-white py-2 font-medium"
          onClick={onNewImage}
        >
          Velg nytt bilde
        </button>
        <button type="button" className="min-h-11 py-2 text-stone-600 underline" onClick={onBack}>
          Tilbake
        </button>
      </div>
    </section>
  );
}
