import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { getCroppedImage, approximateKbFromDataUrl } from "../lib/image-processing";
import { GlassAlert, GlassCard, PrimaryButton, SecondaryButton } from "./AppShell";

type Props = {
  imageSrc: string;
  onConfirm: (dataUrl: string, meta: { kb: number }) => void;
  onBack: () => void;
  onNewImage: () => void;
};

export function BoardImageCropper({ imageSrc, onConfirm, onBack, onNewImage }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setBusy(true);
    setError(null);
    try {
      const result = await getCroppedImage(imageSrc, croppedAreaPixels, rotation);
      setPreview(result.dataUrl);
      onConfirm(result.dataUrl, { kb: result.approximateSizeKb });
    } catch {
      setError("Kunne ikke beskjære bildet.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <GlassCard className="mx-4 mt-4 flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-semibold text-stone-50">Beskjær sjakkbrettet</h2>
        <p className="mt-1 text-sm text-stone-300">
          Plasser hele sjakkbrettet innenfor rammen. Ta med alle 64 rutene, men minst mulig av
          området rundt.
        </p>
      </div>

      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-black/40">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={1}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onRotationChange={setRotation}
          onCropComplete={onCropComplete}
        />
      </div>

      <label className="text-sm text-stone-200">
        Zoom
        <input
          type="range"
          min={1}
          max={3}
          step={0.05}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="mt-1 w-full accent-emerald-500"
        />
      </label>

      {busy && <p className="text-center text-sm text-stone-300">Komprimerer bildet …</p>}
      {preview && (
        <p className="text-xs text-stone-400">
          Forhåndsvisning eksportert (~{approximateKbFromDataUrl(preview)} KB)
        </p>
      )}

      {error && <GlassAlert tone="red">{error}</GlassAlert>}

      <div className="flex flex-col gap-2">
        <PrimaryButton disabled={busy} onClick={() => void handleConfirm()}>
          {busy ? "Behandler …" : "Bruk dette utsnittet"}
        </PrimaryButton>
        <SecondaryButton onClick={() => setRotation((r) => (r + 90) % 360)}>
          Roter
        </SecondaryButton>
        <SecondaryButton onClick={onNewImage}>Velg nytt bilde</SecondaryButton>
        <button type="button" className="min-h-11 py-2 text-stone-300 underline" onClick={onBack}>
          Tilbake
        </button>
      </div>
    </GlassCard>
  );
}
