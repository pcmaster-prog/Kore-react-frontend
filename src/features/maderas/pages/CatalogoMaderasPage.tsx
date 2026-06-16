import { BookOpen, Plus } from "lucide-react";

export default function CatalogoMaderasPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-k-text-h tracking-tight">Catálogo (Administrador)</h1>
          <p className="text-k-text-b text-sm mt-1">
            Gestión de productos, variantes y recetas de ensamblaje.
          </p>
        </div>
        <button className="h-10 px-4 bg-k-text-h text-white rounded-xl font-bold text-sm hover:bg-black transition-colors shadow-lg flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Añadir al Catálogo
        </button>
      </div>

      <div className="bg-k-bg-card border border-k-border rounded-3xl p-6 shadow-k-card text-center py-12">
        <BookOpen className="h-12 w-12 mx-auto text-k-text-b opacity-20 mb-4" />
        <h2 className="text-lg font-bold text-k-text-h">Catálogo Vacío</h2>
        <p className="text-sm text-k-text-b max-w-md mx-auto mt-2">
          Aún no hay productos ni bastones registrados en el sistema. Comienza a poblar el catálogo.
        </p>
      </div>
    </div>
  );
}
