// Tipos de percepción/deducción desglosadas
export type BreakdownItem = {
  code?: string;
  concept: string;
  amount: number;
};

// Firma de recibo
export type ReceiptSignature = {
  signed_at: string | null;
  password_verified: boolean;
  document_hash: string | null;
  signature_image_path?: string | null;
};

// ─── Recibo de Nómina ───
export type ReciboNominaListItem = {
  id: number;
  folio: string;
  status: "pending" | "signed" | "disputed";
  period_start: string;
  period_end: string;
  payment_date: string | null;
  net_pay: number;
  total_perceptions: number;
  total_deductions: number;
  days_worked: number;
  position_title: string | null;
  signed_at: string | null;
  can_sign: boolean;
};

export type ReciboNomina = {
  id: number;
  folio: string;
  status: "pending" | "signed" | "disputed";
  period_start: string;
  period_end: string;
  payment_date: string | null;
  employee_name: string;
  position_title: string | null;
  nss: string | null;
  rfc: string | null;
  curp: string | null;
  daily_salary: number;
  sbc: number;
  days_worked: number;
  perceptions: BreakdownItem[];
  total_perceptions: number;
  deductions: BreakdownItem[];
  total_deductions: number;
  net_pay: number;
  net_pay_words: string | null;
  payment_method: string;
  bank_account: string | null;
  clabe: string | null;
  generated_at: string;
  approved_at: string | null;
  signature: ReceiptSignature | null;
  can_sign: boolean;
};

// ─── Recibo de Gratificación ───
export type GratificationType = {
  id: number;
  code: string;
  name: string;
  description: string | null;
  frequency: "annual" | "biannual" | "quarterly" | "monthly" | "one_time";
  is_active: boolean;
};

export type ReciboGratificacionListItem = {
  id: number;
  folio: string;
  status: "draft" | "approved" | "signed" | "disputed";
  gratification_type: GratificationType;
  fiscal_year: string;
  issue_date: string;
  net_amount: number;
  total_gratification: number;
  total_retentions: number;
  signed_at: string | null;
  can_sign: boolean;
};

export type ReciboGratificacion = {
  id: number;
  folio: string;
  status: "draft" | "approved" | "signed" | "disputed";
  gratification_type: GratificationType;
  fiscal_year: string;
  issue_date: string;
  payment_date: string | null;
  concept_description: string | null;
  employee_name: string;
  position_title: string | null;
  nss: string | null;
  rfc: string | null;
  curp: string | null;
  payment_breakdown: BreakdownItem[];
  total_gratification: number;
  retentions: BreakdownItem[];
  total_retentions: number;
  net_amount: number;
  net_amount_words: string | null;
  approved_at: string | null;
  signature: ReceiptSignature | null;
  can_sign: boolean;
};

// ─── Firma ───
export type FirmaPayload = {
  signature_image: string; // dataURL base64 del canvas
  password: string;
};

export type FirmaResponse = {
  success: boolean;
  message: string;
  signature: {
    signed_at: string;
    document_hash: string;
  };
};
