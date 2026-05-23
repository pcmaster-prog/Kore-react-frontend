/**
 * Convierte array de números de día a string legible
 * diasToString([1,2,3]) → "Lun, Mar, Mié"
 * diasToString([1,2,3,4,5]) → "Lun-Vie"
 * diasToString([1,3,5]) → "Lun, Mié, Vie"
 * diasToString([]) → "—"
 */
export function diasToString(days: number[]): string {
  const map = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  if (!days || days.length === 0) return "—";
  const sorted = [...days].sort((a, b) => a - b);
  // Detectar rango consecutivo
  if (sorted.length >= 2) {
    let consecutive = true;
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] !== sorted[i - 1] + 1) { consecutive = false; break; }
    }
    if (consecutive) return `${map[sorted[0]]}-${map[sorted[sorted.length - 1]]}`;
  }
  return sorted.map((d) => map[d] ?? "?").join(", ");
}

/**
 * Resuelve label legible para el asignado de una regla
 */
export function resolveAssigneeLabel(
  rule: { assigneeType: string; assigneeId?: string | null; sectionId?: string | null },
  maps: {
    employeeMap?: Map<string, string>;
    positionMap?: Map<string, string>;
    sectionMap?: Map<string, string>;
  }
): string {
  const { assigneeType, assigneeId, sectionId } = rule;
  if (assigneeType === "empleado" && assigneeId) {
    return maps.employeeMap?.get(assigneeId) || "Empleado";
  }
  if (assigneeType === "position" && assigneeId) {
    return maps.positionMap?.get(assigneeId) || "Puesto";
  }
  if (assigneeType === "section_supervisor" && sectionId) {
    return maps.sectionMap?.get(sectionId) || "Sección";
  }
  return "Desconocido";
}

export function isImage(mime?: string | null): boolean {
  return String(mime ?? "")
    .toLowerCase()
    .startsWith("image/");
}
