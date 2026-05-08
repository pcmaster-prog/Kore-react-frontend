import { STATUS_LABELS } from "../../constants";

export interface TaskStatusBadgeProps {
  status: string;
}

export default function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 uppercase">
      {STATUS_LABELS[status] || status}
    </span>
  );
}
