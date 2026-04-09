import { getSupabase } from "@/lib/supabase";
import {
  Client,
  SalesPipeline,
  PipelineStatus,
  PaymentType,
} from "@/types/pipeline";

function db() {
  const s = getSupabase();
  if (!s) throw new Error("Supabase not configured");
  return s;
}

export function isSupabaseConfigured(): boolean {
  return getSupabase() !== null;
}

// ============================================
// 全パイプライン + クライアント情報の取得
// ============================================
export async function fetchPipelinesWithClients(): Promise<
  (SalesPipeline & { client: Client })[]
> {
  const { data, error } = await db()
    .from("sales_pipelines")
    .select("*, client:clients(*)")
    .neq("status", "lost")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as (SalesPipeline & { client: Client })[];
}

// ============================================
// クライアント + パイプライン作成
// ============================================
export async function createClientWithPipeline(input: {
  name: string;
  email: string;
  phone?: string;
  notes?: string;
}): Promise<{ client: Client; pipeline: SalesPipeline }> {
  const { data: client, error: clientErr } = await db()
    .from("clients")
    .insert({ name: input.name, email: input.email, phone: input.phone, notes: input.notes })
    .select()
    .single();

  if (clientErr || !client) throw clientErr ?? new Error("Client creation failed");

  const { data: pipeline, error: pipelineErr } = await db()
    .from("sales_pipelines")
    .insert({ client_id: client.id })
    .select()
    .single();

  if (pipelineErr || !pipeline) throw pipelineErr ?? new Error("Pipeline creation failed");

  return { client: client as Client, pipeline: pipeline as SalesPipeline };
}

// ============================================
// 商談結果の設定（受注/失注）
// ============================================
export async function setDealResult(
  pipelineId: string,
  result: "won" | "lost",
  paymentInfo?: {
    payment_type: PaymentType;
    total_amount: number;
    paid_amount: number;
  }
) {
  if (result === "lost") {
    const { error } = await db()
      .from("sales_pipelines")
      .update({ status: "lost" })
      .eq("id", pipelineId);
    if (error) throw error;
    return;
  }

  const total = paymentInfo?.total_amount ?? 0;
  const paid = paymentInfo?.paid_amount ?? 0;

  const { error } = await db()
    .from("sales_pipelines")
    .update({
      status: "won",
      payment_type: paymentInfo?.payment_type,
      total_amount: total,
      paid_amount: paid,
      remaining_amount: total - paid,
      won_at: new Date().toISOString(),
    })
    .eq("id", pipelineId);

  if (error) throw error;
}

// ============================================
// パイプラインフィールド更新（チェックリスト等）
// ============================================
export async function updatePipelineFields(
  pipelineId: string,
  updates: Partial<SalesPipeline>
) {
  const { error } = await db()
    .from("sales_pipelines")
    .update(updates)
    .eq("id", pipelineId);

  if (error) throw error;
}

// ============================================
// ステータス遷移
// ============================================
export async function advanceStatus(
  pipelineId: string,
  newStatus: PipelineStatus,
  timestampField?: string
) {
  const updates: Record<string, unknown> = { status: newStatus };
  if (timestampField) {
    updates[timestampField] = new Date().toISOString();
  }

  const { error } = await db()
    .from("sales_pipelines")
    .update(updates)
    .eq("id", pipelineId);

  if (error) throw error;
}
