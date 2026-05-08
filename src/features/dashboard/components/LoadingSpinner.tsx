export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center p-20 space-y-4">
      <div className="h-12 w-12 border-4 border-obsidian/10 border-t-obsidian rounded-full animate-spin" />
      <div className="text-[11px] font-bold text-k-text-h/40 uppercase tracking-widest animate-pulse">
        Cargando...
      </div>
    </div>
  );
}
