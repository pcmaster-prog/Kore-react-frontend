//features/tasks/routinesApi.ts
import api from "@/lib/http";

export type Routine = {
  id: string;
  name: string;
  recurrence: "daily" | "weekly";
  weekdays?: number[] | null;
  is_active: boolean;
};

export async function listActiveRoutines() {
  const res = await api.get("/task-routines", { params: { active: true } });
  const data = Array.isArray(res.data) ? res.data : (res.data.data ?? []);
  return data as Routine[];
}

export async function assignRoutine(
  routineId: string,
  payload: {
    date: string;
    empleado_ids: string[];
    due_at?: string | null;
    allow_duplicate?: boolean;
  }
) {
  const res = await api.post(`/task-routines/${routineId}/assign`, payload);
  return res.data;
}
