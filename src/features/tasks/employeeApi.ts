//features/tasks/employeeApi.ts
import api from "@/lib/http";

export type Employee = {
  id: string;
  full_name?: string;
  name?: string;
  position_title?: string;
};

/** Red de seguridad por si el backend ignora per_page. */
const MAX_PAGES = 20;

/**
 * Devuelve TODOS los empleados, no solo la primera pagina.
 * El endpoint pagina (20 por defecto): sin esto, las empresas con mas de 20
 * empleados perdian a los ultimos del alfabeto en asistencia, tareas,
 * bitacora y reportes.
 */
export async function listEmployees(): Promise<Employee[]> {
  const query = { per_page: 200 };

  const first = await api.get("/empleados", { params: { ...query, page: 1 } });
  const raw = first.data;
  if (Array.isArray(raw)) return raw;

  const out: Employee[] = Array.isArray(raw?.data) ? [...raw.data] : [];
  const lastPage = Number(raw?.meta?.last_page ?? 1);

  for (let page = 2; page <= Math.min(lastPage, MAX_PAGES); page++) {
    const res = await api.get("/empleados", { params: { ...query, page } });
    const more = res.data?.data;
    if (Array.isArray(more)) out.push(...more);
  }

  return out;
}