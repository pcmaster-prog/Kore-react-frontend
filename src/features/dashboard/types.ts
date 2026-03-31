export type WorkloadLevel = 'bajo' | 'medio' | 'alto';

export type AssignmentProgress = {
  type: 'simple' | 'checklist';
  pct: number;
  done?: number;
  total?: number;
};

export type WorkloadAssignment = {
  assignment_id: string;
  task_id: string;
  task_title: string;
  estimated_minutes: number;
  status: string;
  progress: AssignmentProgress;
};

export type EmployeeWorkload = {
  empleado_id: string;
  full_name: string;
  position_title?: string | null;
  avatar_url?: string | null;
  total_minutes: number;
  total_hours: number;
  task_count: number;
  workload_level: WorkloadLevel;
  assignments: WorkloadAssignment[];
};

export type SupervisorDashData = {
  kpi: {
    pending_review: number;
    active_tasks: number;
    completed_today: number;
  };
  pending_review: Array<{
    assignment_id: string;
    task_id: string;
    task_title: string;
    priority: string;
    empleado_id: string;
    empleado_name: string;
    done_at: string;
    note?: string | null;
  }>;
  workload: EmployeeWorkload[];
};
