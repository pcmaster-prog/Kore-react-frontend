// src/lib/featureFlags.ts
// ─── Feature flags para rollback rápido de cambios UX ────────────────────────
// Cada flag controla un grupo de cambios. Poner en false para revertir.

export const featureFlags = {
  /** Fase 1: Nuevo <PageHeader> unificado (reemplaza hero oscuro + card) */
  newHeader: true,

  /** Fase 1: Nuevo <EmptyState> con variantes celebration/neutral/action */
  newEmptyState: true,

  /** Fase 1: <KpiCard> con hideIfZero por defecto */
  smartKpi: true,

  /** Fase 1: Ocultar breadcrumb en desktop (≥1024px) */
  hideBreadcrumbDesktop: true,

  /** Fase 2: Dashboard Admin inteligente */
  newAdminDashboard: true,

  /** Fase 2: Dashboard Empleado inteligente */
  newEmployeeDashboard: true,

  /** Fase 3: Admin TasksPage refactor */
  newAdminTasks: true,

  /** Fase 3: Employee TasksPage refactor */
  newEmployeeTasks: true,

  /** Fase 3: Nueva Tarea modal enhancements */
  newTaskModal: true,

  /** Fase 4: Gestión Admin refactor */
  newManagementAdmin: true,

  /** Fase 4: Gestión Empleado refactor */
  newManagementEmployee: true,
} as const;

export type FeatureFlag = keyof typeof featureFlags;

/**
 * Check if a feature flag is enabled.
 * Safe to call anywhere — never throws.
 */
export function isEnabled(flag: FeatureFlag): boolean {
  return featureFlags[flag] ?? false;
}
