import { useRef } from "react";
import { GlassAlert, GlassCard, PrimaryButton, SecondaryButton } from "./AppShell";

type Props = {
  onCamera: (file: File) => void;
  onGallery: (file: File) => void;
  error?: string;
  busy?: boolean;
};

export function ImageSourcePicker({ onCamera, onGallery, error, busy = false }: Props) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  return (
    <GlassCard className="mx-4 mt-6 flex flex-col gap-6">
      <header className="text-center">
        <h1 className="text-2xl font-semibold text-stone-50">Borhaug Open - analyse</h1>
        <p className="mt-2 text-stone-300">
          Ta bilde av et fysisk sjakkbrett og gjør stillingen digital.
        </p>
      </header>

      <div className="flex flex-col gap-3">
        <PrimaryButton disabled={busy} onClick={() => cameraRef.current?.click()}>
          {busy ? "Forbereder bildet …" : "Ta bilde"}
        </PrimaryButton>
        <SecondaryButton disabled={busy} onClick={() => galleryRef.current?.click()}>
          Velg bilde
        </SecondaryButton>
      </div>

      {busy && (
        <div className="flex items-center justify-center gap-3 text-sm text-stone-300">
          <div
            className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-emerald-400"
            aria-hidden
          />
          Komprimerer bildet lokalt …
        </div>
      )}

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onCamera(f);
          e.target.value = "";
        }}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onGallery(f);
          e.target.value = "";
        }}
      />

      <ul className="rounded-xl border border-white/15 bg-black/20 p-4 text-sm text-stone-300">
        <li>Ta bildet mest mulig rett ovenfra.</li>
        <li>Sørg for at hele brettet er synlig.</li>
        <li>Unngå hender og andre gjenstander.</li>
        <li>Unngå kraftige skygger og gjenskinn.</li>
        <li>Sørg for tydelig kontrast mellom brikker og brett.</li>
      </ul>

      <p className="text-center text-xs text-stone-400">
        Bildet sendes til OpenAI for å lese av sjakkstillingen. Denne appen lagrer ikke bildet.
      </p>

      {error && <GlassAlert tone="red">{error}</GlassAlert>}
    </GlassCard>
  );
}
