import { XCircle } from "lucide-react";

export interface ErrorCardProps {
  message: string;
}

export default function ErrorCard({ message }: ErrorCardProps) {
  return (
    <div className="rounded-[32px] bg-k-bg-card border border-rose-100 p-8 text-center max-w-md mx-auto mt-10">
      <div className="h-16 w-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <XCircle className="h-8 w-8" />
      </div>
      <h2 className="text-xl font-black text-k-text-h mb-2">Error</h2>
      <p className="text-sm text-k-text-b mb-6">{message}</p>
      <button
        onClick={() => window.location.reload()}
        className="h-11 px-6 bg-k-bg-sidebar text-white rounded-xl font-bold text-sm"
      >
        Reintentar
      </button>
    </div>
  );
}
