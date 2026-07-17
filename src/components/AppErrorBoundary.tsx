import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  children: ReactNode;
};

type State = {
  error: Error | null;
};

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("AppErrorBoundary:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center gap-4 px-4 py-8 text-center">
          <h1 className="text-xl font-semibold text-stone-900">Noe gikk galt</h1>
          <p className="text-sm text-stone-600">
            {this.state.error.message || "En uventet feil oppstod."}
          </p>
          <button
            type="button"
            className="min-h-11 rounded-xl bg-emerald-700 px-6 py-2 text-white"
            onClick={() => this.setState({ error: null })}
          >
            Prøv igjen
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
