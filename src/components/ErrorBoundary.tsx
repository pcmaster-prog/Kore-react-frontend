// src/components/ErrorBoundary.tsx
import React from "react";

interface ErrorBoundaryProps {
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Placeholder para servicio de logging (Sentry, LogRocket, etc.)
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}

// ─── Fallback visual premium ───────────────────────────────────────────────────
function ErrorFallback({ error }: { error?: Error }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-6">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Icon */}
        <div className="mx-auto h-20 w-20 rounded-3xl bg-rose-50 border border-rose-100 flex items-center justify-center shadow-sm">
          <svg
            className="h-10 w-10 text-rose-500"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>

        {/* Message */}
        <div>
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight">
            Algo salió mal
          </h1>
          <p className="mt-3 text-sm text-neutral-500 leading-relaxed">
            Ocurrió un error inesperado en la aplicación. Por favor intenta
            recargar la página.
          </p>
        </div>

        {/* Error detail (dev only) */}
        {error?.message && (
          <div className="rounded-2xl bg-neutral-100 border border-neutral-200 p-4 text-left">
            <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">
              Detalle técnico
            </div>
            <pre className="text-xs text-neutral-600 whitespace-pre-wrap break-words font-mono">
              {error.message}
            </pre>
          </div>
        )}

        {/* Retry */}
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 rounded-2xl bg-neutral-900 text-white px-6 py-3 text-sm font-bold tracking-wide hover:bg-neutral-800 transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182M2.985 14.652" />
          </svg>
          Recargar Página
        </button>

        {/* Footer */}
        <div className="text-[10px] font-bold text-neutral-300 uppercase tracking-[0.2em]">
          Kore · Ops Suite
        </div>
      </div>
    </div>
  );
}
