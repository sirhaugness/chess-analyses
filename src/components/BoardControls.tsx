import type { ComponentProps, ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

export function BoardControls({ children, className = "" }: Props) {
  return (
    <div
      className={`sticky bottom-0 z-10 -mx-4 border-t border-stone-200 bg-stone-50/95 px-4 py-3 backdrop-blur ${className}`}
    >
      <div className="flex max-w-lg mx-auto flex-col gap-2">{children}</div>
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
      ? "bg-emerald-700 text-white"
      : "border border-stone-300 bg-white text-stone-800";
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
