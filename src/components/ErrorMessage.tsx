type Props = {
  message: string;
  onDismiss?: () => void;
};

export function ErrorMessage({ message, onDismiss }: Props) {
  if (!message) return null;
  return (
    <div
      className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-900"
      role="alert"
    >
      <p className="text-sm">{message}</p>
      {onDismiss && (
        <button
          type="button"
          className="mt-2 text-sm font-medium underline"
          onClick={onDismiss}
        >
          Lukk
        </button>
      )}
    </div>
  );
}
