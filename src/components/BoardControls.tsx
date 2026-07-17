import type { ComponentProps, ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

export function BoardControls({ children, className = "" }: Props) {
  return (
    <div
      className={`sticky bottom-0 z-10 -mx-4 border-t border-white/20 bg-stone-950/80 px-4 py-3 backdrop-blur-lg ${className}`}
    >
      <div className="mx-auto flex max-w-lg flex-col gap-2">{children}</div>
    </div>
  );
}

function Btn({
  children,
  onClick,
  variant = "secondary",
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
}) {
  const base = "min-h-11 rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-50";
  const styles =
    variant === "primary"
      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/30"
      : "border border-white/25 bg-white/10 text-stone-100 backdrop-blur-sm";
  return (
    <button type="button" className={`${base} ${styles}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

BoardControls.Primary = function PrimaryBtn(
  props: Omit<ComponentProps<typeof Btn>, "variant">,
) {
  return <Btn {...props} variant="primary" />;
};
BoardControls.Secondary = function SecondaryBtn(props: Omit<ComponentProps<typeof Btn>, "variant">) {
  return <Btn {...props} variant="secondary" />;
};
