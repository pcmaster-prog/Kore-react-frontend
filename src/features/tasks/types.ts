//features/tasks/types.ts
export type TaskStatus = "open" | "in_progress" | "completed";

export type Task = {
  id: string;
  title: string;
  description?: string | null;
  priority?: string | null;
  status: TaskStatus;
  due_at?: string | null;
  created_at: string;
  meta?: Record<string, any> | null;

  // Campos enriquecidos desde el backend (eager-load)
  has_evidence?: boolean | null;
  evidence_count?: number | null;
  assignee_name?: string | null;
  empleado?: {
    id: string;
    full_name?: string | null;
    name?: string | null;
    avatar_url?: string | null;
  } | null;
};

export type Paginated<T> = {
  current_page: number;
  data: T[];
  last_page: number;
  per_page: number;
  total: number;
};
