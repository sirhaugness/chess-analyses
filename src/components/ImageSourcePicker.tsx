import { useRef } from "react";

type Props = {
  onCamera: (file: File) => void;
  onGallery: (file: File) => void;
  error?: string;
};

export function ImageSourcePicker({ onCamera, onGallery, error }: Props) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  return (
    <section className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-8">
      <header className="text-center">
        <h1 className="text-2xl font-semibold text-stone-900">Sjakkbrett fra bilde</h1>
        <p className="mt-2 text-stone-600">
          Ta bilde av et fysisk sjakkbrett og gjør stillingen digital.
        </p>
      </header>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          className="min-h-12 rounded-xl bg-emerald-700 px-6 py-3 text-lg font-medium text-white"
          onClick={() => cameraRef.current?.click()}
        >
          Ta bilde
        </button>
        <button
          type="button"
          className="min-h-12 rounded-xl border border-stone-300 bg-white px-6 py-3 text-lg font-medium text-stone-800"
          onClick={() => galleryRef.current?.click()}
        >
          Velg bilde
        </button>
      </div>

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

      <ul className="rounded-xl bg-white p-4 text-sm text-stone-600 shadow-sm">
        <li>Ta bildet mest mulig rett ovenfra.</li>
        <li>Sørg for at hele brettet er synlig.</li>
        <li>Unngå hender og andre gjenstander.</li>
        <li>Unngå kraftige skygger og gjenskinn.</li>
        <li>Sørg for tydelig kontrast mellom brikker og brett.</li>
      </ul>

      <p className="text-center text-xs text-stone-500">
        Bildet sendes til OpenAI for å lese av sjakkstillingen. Denne appen lagrer ikke
        bildet.
      </p>

      {error && (
        <p className="text-center text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
