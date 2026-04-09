"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePipelineStore } from "@/lib/store";
import {
  PAYMENT_TYPE_LABELS,
  STATUS_LABELS,
  PaymentType,
} from "@/types/pipeline";
import {
  Mail,
  Phone,
  Copy,
  AlertTriangle,
  ArrowRight,
  Banknote,
} from "lucide-react";
import { useState } from "react";

export function ClientDetailSheet() {
  const {
    selectedPipelineId,
    selectPipeline,
    pipelines,
    clients,
    updatePipelineField,
    setDealResult,
    advanceToHandedOver,
    advanceToActive,
  } = usePipelineStore();

  const pipeline = pipelines.find((p) => p.id === selectedPipelineId);
  const client = pipeline
    ? clients.find((c) => c.id === pipeline.client_id)
    : null;

  const [dealPaymentType, setDealPaymentType] = useState<PaymentType>("bank_transfer");
  const [dealTotal, setDealTotal] = useState("500000");
  const [dealPaid, setDealPaid] = useState("500000");

  if (!pipeline || !client) {
    return null;
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleWon = () => {
    const total = parseInt(dealTotal) || 0;
    const paid = parseInt(dealPaid) || 0;
    setDealResult(pipeline.id, "won", {
      payment_type: dealPaymentType,
      total_amount: total,
      paid_amount: paid,
    });
  };

  const canAdvanceToHandedOver =
    pipeline.status === "won" && pipeline.is_chatwork_connected;

  const canAdvanceToActive =
    pipeline.status === "onboarding" &&
    pipeline.is_membership_invited &&
    pipeline.is_utage_account_issued;

  return (
    <Sheet
      open={!!selectedPipelineId}
      onOpenChange={(open) => {
        if (!open) selectPipeline(null);
      }}
    >
      <SheetContent className="w-[480px] sm:max-w-[480px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {client.name}
            <Badge
              variant={
                pipeline.status === "active"
                  ? "default"
                  : pipeline.status === "lost"
                  ? "destructive"
                  : "secondary"
              }
            >
              {STATUS_LABELS[pipeline.status]}
            </Badge>
          </SheetTitle>
        </SheetHeader>

        <div className="px-4 pb-4 space-y-6">
          {/* 基本情報 */}
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">
              基本情報（Utage発行用）
            </h3>
            <div className="space-y-2 bg-muted/50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-mono">{client.email}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(client.email)}
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">名前: {client.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(client.name)}
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
              {client.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{client.phone}</span>
                </div>
              )}
            </div>
          </section>

          <Separator />

          {/* 商談結果入力（lead時） */}
          {pipeline.status === "lead" && (
            <section>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                商談結果を入力
              </h3>
              <div className="space-y-3 bg-blue-50 rounded-lg p-3">
                <div>
                  <Label className="text-xs">支払い方法</Label>
                  <div className="flex gap-1 mt-1">
                    {(["bank_transfer", "credit_card", "partial"] as PaymentType[]).map(
                      (type) => (
                        <Button
                          key={type}
                          type="button"
                          variant={dealPaymentType === type ? "default" : "outline"}
                          size="sm"
                          className="text-xs"
                          onClick={() => setDealPaymentType(type)}
                        >
                          {PAYMENT_TYPE_LABELS[type]}
                        </Button>
                      )
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">総額（円）</Label>
                    <Input
                      type="number"
                      value={dealTotal}
                      onChange={(e) => setDealTotal(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">支払済み（円）</Label>
                    <Input
                      type="number"
                      value={dealPaid}
                      onChange={(e) => setDealPaid(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={handleWon}>
                    受注にする
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setDealResult(pipeline.id, "lost")}
                  >
                    失注
                  </Button>
                </div>
              </div>
            </section>
          )}

          {/* 金銭状況 */}
          {pipeline.payment_type && (
            <section>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-1">
                <Banknote className="w-4 h-4" />
                金銭状況
              </h3>
              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>支払い方法</span>
                  <Badge variant="outline">
                    {PAYMENT_TYPE_LABELS[pipeline.payment_type]}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>総額</span>
                  <span className="font-semibold">
                    ¥{pipeline.total_amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>支払済み</span>
                  <span className="text-green-600 font-semibold">
                    ¥{pipeline.paid_amount.toLocaleString()}
                  </span>
                </div>
                {pipeline.remaining_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1 text-amber-600">
                      <AlertTriangle className="w-3 h-3" />
                      残金
                    </span>
                    <span className="text-amber-600 font-bold">
                      ¥{pipeline.remaining_amount.toLocaleString()}
                    </span>
                  </div>
                )}
                {pipeline.payment_notes && (
                  <p className="text-xs text-muted-foreground mt-1 bg-white p-2 rounded">
                    {pipeline.payment_notes}
                  </p>
                )}
              </div>
            </section>
          )}

          <Separator />

          {/* Phase 1: 営業チェックリスト */}
          <section>
            <h3 className="text-sm font-semibold text-blue-600 mb-3">
              Phase 1: 営業タスク
            </h3>
            <div className="space-y-3">
              <ChecklistItem
                checked={pipeline.is_chatwork_connected}
                label="Chatwork接続完了（運営×顧客グループ作成）"
                onChange={(checked) =>
                  updatePipelineField(pipeline.id, {
                    is_chatwork_connected: checked,
                  })
                }
                disabled={pipeline.status === "lead" || pipeline.status === "active"}
              />
            </div>
            {pipeline.status === "won" && (
              <div className="mt-3">
                <Button
                  className="w-full"
                  disabled={!canAdvanceToHandedOver}
                  onClick={() => advanceToHandedOver(pipeline.id)}
                >
                  <ArrowRight className="w-4 h-4 mr-1" />
                  あっと夫婦へ引き継ぐ
                </Button>
                {!canAdvanceToHandedOver && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Chatwork接続を完了してください
                  </p>
                )}
              </div>
            )}
          </section>

          <Separator />

          {/* Phase 2: 運営チェックリスト */}
          <section>
            <h3 className="text-sm font-semibold text-purple-600 mb-3">
              Phase 2: 運営タスク
            </h3>
            <div className="space-y-3">
              <ChecklistItem
                checked={pipeline.is_membership_invited}
                label="会員専用グループ・サイト招待完了"
                onChange={(checked) =>
                  updatePipelineField(pipeline.id, {
                    is_membership_invited: checked,
                    status:
                      pipeline.status === "handed_over" && checked
                        ? "onboarding"
                        : pipeline.status,
                  })
                }
                disabled={
                  pipeline.status === "lead" ||
                  pipeline.status === "won" ||
                  pipeline.status === "active"
                }
              />
              <ChecklistItem
                checked={pipeline.is_utage_account_issued}
                label="Utageアカウント発行完了"
                onChange={(checked) =>
                  updatePipelineField(pipeline.id, {
                    is_utage_account_issued: checked,
                  })
                }
                disabled={
                  pipeline.status === "lead" ||
                  pipeline.status === "won" ||
                  pipeline.status === "active"
                }
              />
            </div>
            {pipeline.status === "onboarding" && (
              <div className="mt-3">
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={!canAdvanceToActive}
                  onClick={() => advanceToActive(pipeline.id)}
                >
                  <ArrowRight className="w-4 h-4 mr-1" />
                  受講開始にする
                </Button>
                {!canAdvanceToActive && (
                  <p className="text-xs text-muted-foreground mt-1">
                    全てのチェックを完了してください
                  </p>
                )}
              </div>
            )}
          </section>

          {/* タイムライン */}
          {(pipeline.won_at || pipeline.handed_over_at || pipeline.activated_at) && (
            <>
              <Separator />
              <section>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                  タイムライン
                </h3>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>登録: {new Date(pipeline.created_at).toLocaleDateString("ja-JP")}</p>
                  {pipeline.won_at && (
                    <p>受注: {new Date(pipeline.won_at).toLocaleDateString("ja-JP")}</p>
                  )}
                  {pipeline.handed_over_at && (
                    <p>
                      引継: {new Date(pipeline.handed_over_at).toLocaleDateString("ja-JP")}
                    </p>
                  )}
                  {pipeline.activated_at && (
                    <p>
                      開始: {new Date(pipeline.activated_at).toLocaleDateString("ja-JP")}
                    </p>
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ChecklistItem({
  checked,
  label,
  onChange,
  disabled,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
  disabled: boolean;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <Checkbox
        checked={checked}
        onCheckedChange={(v) => onChange(v === true)}
        disabled={disabled}
      />
      <span
        className={`text-sm ${
          checked ? "line-through text-muted-foreground" : ""
        } ${disabled ? "opacity-50" : ""}`}
      >
        {label}
      </span>
    </label>
  );
}
