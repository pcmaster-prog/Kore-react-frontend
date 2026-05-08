import type { Task } from "./types";
import type { PendingApprovalItem } from "./api";
import type { EvidenceItem } from "./api";

export interface ChecklistItemState {
  done: boolean;
  at?: string;
}

export interface EvChecklist {
  def: Array<{ id: string; label?: string; required?: boolean }> | null;
  state: Record<string, ChecklistItemState> | null;
}

export interface EmployeeOption {
  id: string;
  full_name?: string;
  name?: string;
}

export interface TaskAssignee {
  id?: string;
  empleado?: {
    id?: string;
    full_name?: string | null;
    name?: string | null;
    avatar_url?: string | null;
  } | null;
  has_evidence?: boolean;
}

export interface ExtendedTask extends Task {
  assignees?: TaskAssignee[] | undefined;
  evidences?: unknown[] | null;
  evidence?: unknown[] | null;
  has_evidences?: boolean | null;
}

export interface TasksListData {
  data: ExtendedTask[];
  total: number;
  last_page: number;
  last_7_days?: number[];
  effectiveness?: number;
}

export interface ExtendedPendingApproval extends PendingApprovalItem {
  meta?: Record<string, unknown> | null;
  task?: PendingApprovalItem["task"] & {
    meta?: Record<string, unknown> | null;
  };
}

export type { EvidenceItem };
