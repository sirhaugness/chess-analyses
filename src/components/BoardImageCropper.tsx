import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { getCroppedImage, approximateKbFromDataUrl } from "../lib/image-processing";

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
    <section className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-6">
      <h2 className="text-xl font-semibold text-stone-900">Beskjær sjakkbrettet</h2>
      <p className="text-sm text-stone-600">
        Plasser hele sjakkbrettet innenfor rammen. Ta med alle 64 rutene, men minst mulig av
        området rundt.
      </p>

      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-stone-900">
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

      <label className="text-sm text-stone-700">
        Zoom
        <input
          type="range"
          min={1}
          max={3}
          step={0.05}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="mt-1 w-full"
        />
      </label>

      {preview && (
        <p className="text-xs text-stone-500">
          Forhåndsvisning eksportert (~{approximateKbFromDataUrl(preview)} KB)
        </p>
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
          onClick={() => setRotation((r) => (r + 90) % 360)}
        >
          Roter
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
