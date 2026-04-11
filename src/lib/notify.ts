import { PipelineStatus, STATUS_LABELS } from "@/types/pipeline";

// ステータス変更時のChatwork通知
export async function notifyStatusChange(
  clientName: string,
  oldStatus: PipelineStatus,
  newStatus: PipelineStatus,
  detail?: string
) {
  const statusEmoji: Record<PipelineStatus, string> = {
    lead: "💬",
    won: "🎉",
    lost: "😢",
    handed_over: "🤝",
    onboarding: "⚙️",
    active: "✅",
  };

  const message = `[info][title]${statusEmoji[newStatus]} ステータス更新: ${clientName}[/title]${STATUS_LABELS[oldStatus]} → ${STATUS_LABELS[newStatus]}${detail ? `\n${detail}` : ""}[/info]`;

  try {
    await fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
  } catch (e) {
    console.error("通知送信失敗:", e);
  }
}

// 新規登録時の通知
export async function notifyNewClient(clientName: string, email: string) {
  const message = `[info][title]🆕 新規相談申し込み: ${clientName}[/title]メール: ${email}[/info]`;
  try {
    await fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
  } catch (e) {
    console.error("通知送信失敗:", e);
  }
}
