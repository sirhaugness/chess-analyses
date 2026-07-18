import { useCallback, useState } from "react";
import Cropper, { type Area, type MediaSize } from "react-easy-crop";
import { getCroppedImage } from "../lib/image-processing";
import { GlassAlert, PrimaryButton, SecondaryButton } from "./AppShell";

type Props = {
  imageSrc: string;
  onConfirm: (dataUrl: string, meta: { kb: number }) => void;
  onBack: () => void;
  onNewImage: () => void;
};

function ZoomButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex h-14 min-w-14 items-center justify-center rounded-xl border border-white/25 bg-stone-900/80 text-2xl font-semibold text-stone-50 backdrop-blur-sm disabled:opacity-40"
      aria-label={label}
    >
      {label}
    </button>
  );
}

export function BoardImageCropper({ imageSrc, onConfirm, onBack, onNewImage }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [minZoom, setMinZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const onMediaLoaded = useCallback((media: MediaSize) => {
    const fitZoom = Math.max(media.width, media.height) / Math.min(media.width, media.height);
    const nextMin = Math.max(1, fitZoom * 0.85);
    setMinZoom(nextMin);
    setZoom(nextMin);
    setCrop({ x: 0, y: 0 });
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setBusy(true);
    setError(null);
    try {
      const result = await getCroppedImage(imageSrc, croppedAreaPixels, rotation);
      onConfirm(result.dataUrl, { kb: result.approximateSizeKb });
    } catch {
      setError("Kunne ikke beskjære bildet.");
    } finally {
      setBusy(false);
    }
  };

  const stepZoom = (delta: number) => {
    setZoom((z) => Math.min(4, Math.max(minZoom, Number((z + delta).toFixed(2)))));
  };

  return (
    <div className="fixed inset-0 z-20 flex flex-col bg-stone-950">
      <header className="shrink-0 border-b border-white/10 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <h2 className="text-lg font-semibold text-stone-50">Beskjær sjakkbrettet</h2>
        <p className="mt-1 text-sm text-stone-300">
          Dra bildet og knip for å zoome. Plasser alle 64 rutene innenfor rammen.
        </p>
      </header>

      <div className="relative min-h-0 flex-1 touch-none">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          minZoom={minZoom}
          maxZoom={4}
          rotation={rotation}
          aspect={1}
          showGrid
          zoomWithScroll={false}
          restrictPosition={false}
          objectFit="contain"
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onRotationChange={setRotation}
          onCropComplete={onCropComplete}
          onMediaLoaded={onMediaLoaded}
        />
      </div>

      {error && (
        <div className="shrink-0 px-4">
          <GlassAlert tone="red">{error}</GlassAlert>
        </div>
      )}

      <div className="shrink-0 space-y-3 border-t border-white/10 bg-stone-950/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md">
        <div className="flex items-center justify-center gap-3">
          <ZoomButton label="−" onClick={() => stepZoom(-0.15)} disabled={zoom <= minZoom} />
          <p className="min-w-16 text-center text-sm text-stone-300">{Math.round(zoom * 100)} %</p>
          <ZoomButton label="+" onClick={() => stepZoom(0.15)} disabled={zoom >= 4} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <SecondaryButton onClick={() => setRotation((r) => (r + 90) % 360)}>
            Roter 90°
          </SecondaryButton>
          <SecondaryButton onClick={onNewImage}>Nytt bilde</SecondaryButton>
        </div>

        <PrimaryButton disabled={busy} onClick={() => void handleConfirm()}>
          {busy ? "Behandler …" : "Bruk utsnitt og analyser"}
        </PrimaryButton>

        <button type="button" className="min-h-11 w-full py-1 text-sm text-stone-400 underline" onClick={onBack}>
          Tilbake
        </button>
      </div>
    </div>
  );
}
