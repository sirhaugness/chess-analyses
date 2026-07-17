import type { ReactNode } from "react";

const KNIGHT_BG = `${import.meta.env.BASE_URL}knight-watermark.svg`;

type Props = {
  children: ReactNode;
  className?: string;
  as?: "section" | "div" | "header";
};

export function GlassCard({ children, className = "", as: Tag = "section" }: Props) {
  return (
    <Tag
      className={`rounded-2xl border border-white/20 bg-white/10 p-4 shadow-xl shadow-black/20 backdrop-blur-lg sm:p-6 ${className}`}
    >
      {children}
    </Tag>
  );
}

type ShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: ShellProps) {
  return (
    <div className="relative min-h-dvh overflow-x-hidden">
      <div className="chess-bg pointer-events-none fixed inset-0 -z-10" aria-hidden />
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-no-repeat opacity-100"
        style={{
          backgroundImage: `url(${KNIGHT_BG})`,
          backgroundSize: "min(72vw, 440px)",
          backgroundPosition: "right -8% bottom 8%",
        }}
        aria-hidden
      />
      <div className="relative z-0 mx-auto w-full max-w-lg pb-8">{children}</div>
    </div>
  );
}

export function GlassAlert({
  children,
  tone = "amber",
}: {
  children: ReactNode;
  tone?: "amber" | "red" | "info";
}) {
  const tones = {
    amber: "border-amber-300/40 bg-amber-950/40 text-amber-50",
    red: "border-red-300/40 bg-red-950/40 text-red-50",
    info: "border-white/20 bg-white/10 text-stone-100",
  };
  return (
    <p className={`rounded-xl border px-4 py-3 text-sm backdrop-blur-md ${tones[tone]}`} role="alert">
      {children}
    </p>
  );
}

export function PrimaryButton({
  children,
  disabled,
  onClick,
  className = "",
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`min-h-12 w-full rounded-xl bg-emerald-600 px-4 py-3 font-medium text-white shadow-lg shadow-emerald-900/30 transition hover:bg-emerald-500 disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  disabled,
  onClick,
  className = "",
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`min-h-11 w-full rounded-xl border border-white/25 bg-white/10 px-4 py-2 font-medium text-stone-100 backdrop-blur-sm transition hover:bg-white/20 disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}
