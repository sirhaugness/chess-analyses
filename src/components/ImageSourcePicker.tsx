import { useRef, type ReactNode } from "react";
import { GlassAlert } from "./AppShell";

const HERO_IMAGE = `${import.meta.env.BASE_URL}borhaug-open-hero.png`;

type Props = {
  onCamera: (file: File) => void;
  onGallery: (file: File) => void;
  error?: string;
  busy?: boolean;
};

function ActionButton({
  children,
  disabled,
  onClick,
  variant = "primary",
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  variant?: "primary" | "secondary";
}) {
  const base =
    "min-h-12 min-w-[7.5rem] rounded-xl px-4 py-3 text-sm font-semibold shadow-lg backdrop-blur-md transition disabled:opacity-50 sm:min-w-[8.5rem] sm:text-base";
  const styles =
    variant === "primary"
      ? "border border-emerald-300/40 bg-emerald-950/75 text-emerald-50 hover:bg-emerald-900/85"
      : "border border-white/35 bg-stone-950/65 text-stone-50 hover:bg-stone-900/75";
  return (
    <button type="button" disabled={disabled} onClick={onClick} className={`${base} ${styles}`}>
      {children}
    </button>
  );
}

export function ImageSourcePicker({ onCamera, onGallery, error, busy = false }: Props) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  return (
    <section className="relative -mx-4 min-h-dvh overflow-hidden">
      <img
        src={HERO_IMAGE}
        alt="Borhaug Open"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/35" aria-hidden />

      <div className="relative z-10 flex min-h-dvh flex-col">
        <div className="flex flex-1 flex-col justify-center px-3 pb-8 pt-24 sm:px-5">
          <div className="mx-auto grid w-full max-w-md grid-cols-[1fr_7.5rem_1fr] items-center gap-2 sm:grid-cols-[1fr_9rem_1fr] sm:gap-3">
            <div className="flex justify-end">
              <ActionButton disabled={busy} onClick={() => cameraRef.current?.click()}>
                {busy ? "Forbereder …" : "Ta bilde"}
              </ActionButton>
            </div>
            <div aria-hidden className="h-24 sm:h-28" />
            <div className="flex justify-start">
              <ActionButton
                disabled={busy}
                variant="secondary"
                onClick={() => galleryRef.current?.click()}
              >
                Velg bilde
              </ActionButton>
            </div>
          </div>

          {busy && (
            <div className="mt-6 flex items-center justify-center gap-3 text-sm text-stone-100 drop-shadow">
              <div
                className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-emerald-300"
                aria-hidden
              />
              Komprimerer bildet lokalt …
            </div>
          )}
        </div>

        <div className="space-y-3 px-4 pb-6">
          {error && <GlassAlert tone="red">{error}</GlassAlert>}
          <p className="text-center text-xs text-stone-100/90 drop-shadow">
            Bildet sendes til OpenAI for å lese av sjakkstillingen. Denne appen lagrer ikke bildet.
          </p>
        </div>
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
    </section>
  );
}
