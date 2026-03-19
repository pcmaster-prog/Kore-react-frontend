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
};

export type Paginated<T> = {
  current_page: number;
  data: T[];
  last_page: number;
  per_page: number;
  total: number;
};
