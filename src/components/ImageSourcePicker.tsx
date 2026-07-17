import { useRef, type ReactNode } from "react";
import { GlassAlert } from "./AppShell";

const HERO_IMAGE = `${import.meta.env.BASE_URL}borhaug-open-hero.png`;

/** Share of image width reserved for the king — buttons stay outside this band. */
const KING_BAND = "min(46%, 11.5rem)";

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
    "max-w-full truncate rounded-lg px-2 py-2 text-[0.7rem] font-semibold leading-tight shadow-lg backdrop-blur-md transition disabled:opacity-50 min-[380px]:px-3 min-[380px]:text-xs sm:min-h-11 sm:rounded-xl sm:px-4 sm:py-2.5 sm:text-sm";
  const styles =
    variant === "primary"
      ? "border border-emerald-300/40 bg-emerald-950/80 text-emerald-50 hover:bg-emerald-900/90"
      : "border border-white/35 bg-stone-950/70 text-stone-50 hover:bg-stone-900/80";
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
    <section className="home-hero relative -mx-4 flex min-h-dvh flex-col bg-stone-950">
      <div className="flex flex-1 flex-col items-center justify-center px-1 py-2 sm:px-2">
        <div className="relative w-full max-w-lg">
          <img
            src={HERO_IMAGE}
            alt="Borhaug Open"
            className="mx-auto block h-auto max-h-[calc(100dvh-6.5rem)] w-full object-contain"
          />

          {/* Buttons flank the king — vertical % tuned to statue mid-section in hero art */}
          <div
            className="absolute inset-x-[1.5%] top-[53%] grid -translate-y-1/2 items-center gap-x-0.5 min-[380px]:inset-x-[2%] min-[380px]:gap-x-1 sm:gap-x-2"
            style={{
              gridTemplateColumns: `1fr ${KING_BAND} 1fr`,
            }}
          >
            <div className="flex min-w-0 justify-end pr-0.5">
              <ActionButton disabled={busy} onClick={() => cameraRef.current?.click()}>
                {busy ? "Forbereder …" : "Ta bilde"}
              </ActionButton>
            </div>
            <div aria-hidden className="min-w-0" />
            <div className="flex min-w-0 justify-start pl-0.5">
              <ActionButton
                disabled={busy}
                variant="secondary"
                onClick={() => galleryRef.current?.click()}
              >
                Velg bilde
              </ActionButton>
            </div>
          </div>
        </div>

        {busy && (
          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-stone-200 sm:text-sm">
            <div
              className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-emerald-300"
              aria-hidden
            />
            Komprimerer bildet lokalt …
          </div>
        )}
      </div>

      <div className="space-y-2 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-1">
        {error && <GlassAlert tone="red">{error}</GlassAlert>}
        <p className="text-center text-sm leading-snug text-stone-200 sm:text-base">
          Ta bilde av en sjakkstilling og få den opp i et analysebrett
        </p>
        <p className="text-center text-[0.65rem] leading-snug text-stone-400 sm:text-xs">
          Bildet sendes til OpenAI for å lese av sjakkstillingen. Denne appen lagrer ikke bildet.
        </p>
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
