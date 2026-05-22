// src/features/tasks/taskStore.ts
// ─── Zustand store para selección de área/sección/tarea ─────────────────────
// No usa persistencia — solo estado en memoria de la sesión.

import { create } from "zustand";

interface TaskStoreState {
  selectedAreaId: string | null;
  selectedSectionId: string | null;
  selectedTaskId: string | null;

  selectArea: (areaId: string | null) => void;
  selectSection: (sectionId: string | null) => void;
  selectTask: (taskId: string | null) => void;
  clearSelection: () => void;
}

export const useTaskStore = create<TaskStoreState>()((set) => ({
  selectedAreaId: null,
  selectedSectionId: null,
  selectedTaskId: null,

  selectArea: (areaId) =>
    set({
      selectedAreaId: areaId,
      selectedSectionId: null,
      selectedTaskId: null,
    }),

  selectSection: (sectionId) =>
    set({
      selectedSectionId: sectionId,
      selectedTaskId: null,
    }),

  selectTask: (taskId) =>
    set({
      selectedTaskId: taskId,
    }),

  clearSelection: () =>
    set({
      selectedAreaId: null,
      selectedSectionId: null,
      selectedTaskId: null,
    }),
}));
