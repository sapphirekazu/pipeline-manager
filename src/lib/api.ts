import { getSupabase } from "@/lib/supabase";
import {
  Client,
  SalesPipeline,
  PipelineStatus,
  PaymentType,
  ActivityLog,
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
// 操作ログ記録
// ============================================
export async function addLog(
  clientName: string,
  action: string,
  pipelineId?: string,
  detail?: string
) {
  const { error } = await db()
    .from("activity_logs")
    .insert({
      pipeline_id: pipelineId ?? null,
      client_name: clientName,
      action,
      detail,
    });
  if (error) console.error("Log error:", error);
}

// ============================================
// 操作ログ取得（直近50件）
// ============================================
export async function fetchActivityLogs(): Promise<ActivityLog[]> {
  const { data, error } = await db()
    .from("activity_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  return (data ?? []) as ActivityLog[];
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

  await addLog(input.name, "created", pipeline.id, `メール: ${input.email}`);

  return { client: client as Client, pipeline: pipeline as SalesPipeline };
}

// ============================================
// 商談結果の設定（受注/失注）
// ============================================
export async function setDealResult(
  pipelineId: string,
  clientName: string,
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
    await addLog(clientName, "lost", pipelineId);
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
  await addLog(clientName, "won", pipelineId, `総額: ¥${total.toLocaleString()} / 支払済: ¥${paid.toLocaleString()}`);
}

// ============================================
// パイプラインフィールド更新（チェックリスト等）
// ============================================
export async function updatePipelineFields(
  pipelineId: string,
  clientName: string,
  updates: Partial<SalesPipeline>
) {
  const { error } = await db()
    .from("sales_pipelines")
    .update(updates)
    .eq("id", pipelineId);

  if (error) throw error;

  // チェックリスト操作をログ記録
  if (updates.is_chatwork_connected === true) {
    await addLog(clientName, "chatwork_connected", pipelineId);
  }
  if (updates.is_membership_invited === true) {
    await addLog(clientName, "membership_invited", pipelineId);
  }
  if (updates.is_utage_account_issued === true) {
    await addLog(clientName, "utage_issued", pipelineId);
  }
  if (updates.status && !updates.is_membership_invited && !updates.is_chatwork_connected && !updates.is_utage_account_issued) {
    await addLog(clientName, updates.status, pipelineId);
  }
}

// ============================================
// パイプライン + クライアント削除
// ============================================
export async function deletePipeline(pipelineId: string, clientId: string, clientName: string) {
  await addLog(clientName, "deleted", pipelineId);

  const { error: pErr } = await db()
    .from("sales_pipelines")
    .delete()
    .eq("id", pipelineId);
  if (pErr) throw pErr;

  const { error: cErr } = await db()
    .from("clients")
    .delete()
    .eq("id", clientId);
  if (cErr) throw cErr;
}

// ============================================
// ステータス遷移
// ============================================
export async function advanceStatus(
  pipelineId: string,
  clientName: string,
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
  await addLog(clientName, newStatus, pipelineId);
}
