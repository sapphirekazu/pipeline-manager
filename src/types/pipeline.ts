export type PipelineStatus =
  | "lead"
  | "won"
  | "lost"
  | "handed_over"
  | "onboarding"
  | "active";

export type PaymentType = "bank_transfer" | "credit_card" | "partial";

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SalesPipeline {
  id: string;
  client_id: string;
  client?: Client;
  status: PipelineStatus;
  consultation_date?: string;
  payment_type?: PaymentType;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  payment_notes?: string;
  is_chatwork_connected: boolean;
  is_membership_invited: boolean;
  is_utage_account_issued: boolean;
  sales_rep?: string;
  won_at?: string;
  handed_over_at?: string;
  activated_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentRecord {
  id: string;
  pipeline_id: string;
  amount: number;
  payment_date: string;
  method?: string;
  notes?: string;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  pipeline_id?: string;
  client_name: string;
  action: string;
  detail?: string;
  created_at: string;
}

export const ACTION_LABELS: Record<string, string> = {
  created: "新規登録",
  won: "受注",
  lost: "失注",
  handed_over: "引き継ぎ",
  onboarding: "設定開始",
  active: "受講開始",
  deleted: "削除",
  chatwork_connected: "Chatwork接続",
  membership_invited: "会員招待",
  utage_issued: "Utage発行",
  updated: "更新",
};

// カンバンボードのカラム定義
export const KANBAN_COLUMNS: {
  id: PipelineStatus;
  label: string;
  color: string;
  phase: "sales" | "operations";
}[] = [
  { id: "lead", label: "相談前", color: "bg-slate-100 border-slate-300", phase: "sales" },
  { id: "won", label: "受注/入金待ち", color: "bg-blue-50 border-blue-300", phase: "sales" },
  { id: "handed_over", label: "引き継ぎ済み", color: "bg-amber-50 border-amber-300", phase: "operations" },
  { id: "onboarding", label: "Utage等設定中", color: "bg-purple-50 border-purple-300", phase: "operations" },
  { id: "active", label: "受講開始", color: "bg-green-50 border-green-300", phase: "operations" },
];

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  bank_transfer: "銀行一括",
  credit_card: "クレジット",
  partial: "頭金のみ（分割）",
};

export const STATUS_LABELS: Record<PipelineStatus, string> = {
  lead: "相談前",
  won: "受注",
  lost: "失注",
  handed_over: "引き継ぎ済み",
  onboarding: "設定中",
  active: "受講中",
};
