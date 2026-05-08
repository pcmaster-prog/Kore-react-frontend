export type PaymentType = "hourly" | "daily";

export type Entry = {
  id: string;
  empleado_id: string;
  empleado_name: string;
  empleado_role?: string | null;
  payment_type: PaymentType;
  rate: number;
  units: number;
  rest_days_paid: number;
  holidays_paid: number;
  tardiness_count: number;
  absences_count: number;
  penalty_active: boolean;
  subtotal: number;
  adjustment_amount: number;
  adjustment_note?: string | null;
  bonus_amount: number;
  bonus_note?: string | null;
  total: number;
};

export type Period = {
  id: string;
  week_start: string;
  week_end: string;
  status: "draft" | "approved";
  total_amount: number;
  total_adjustments: number;
  total_bonuses: number;
  approved_at?: string | null;
  excluded_employee_ids?: string[];
  notes?: string | null;
  entries: Entry[];
};

export type MealScheduleItem = {
  employee_id: string;
  employee_name?: string;
  meal_start_time: string;
  duration_minutes: number;
};
