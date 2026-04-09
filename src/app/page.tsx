"use client";

import { useEffect } from "react";
import { KanbanBoard } from "@/components/kanban-board";
import { ClientDetailSheet } from "@/components/client-detail-sheet";
import { AddClientDialog } from "@/components/add-client-dialog";
import { ActivityLogPanel } from "@/components/activity-log-panel";
import { usePipelineStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

export default function Home() {
  const pipelines = usePipelineStore((s) => s.pipelines);
  const loading = usePipelineStore((s) => s.loading);
  const fetchData = usePipelineStore((s) => s.fetchData);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const stats = {
    lead: pipelines.filter((p) => p.status === "lead").length,
    won: pipelines.filter((p) => p.status === "won").length,
    active: pipelines.filter((p) => p.status === "active").length,
    totalRemaining: pipelines
      .filter((p) => p.remaining_amount > 0)
      .reduce((sum, p) => sum + p.remaining_amount, 0),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                講座パイプライン管理
              </h1>
              <p className="text-sm text-muted-foreground">
                あっと夫婦 - 個別相談から受講開始まで
              </p>
            </div>
            <AddClientDialog />
          </div>
        </div>
      </header>

      {/* サマリー */}
      <div className="max-w-[1600px] mx-auto px-6 py-4">
        <div className="flex gap-3 mb-4">
          <SummaryCard label="相談前" value={stats.lead} color="text-slate-600" />
          <SummaryCard label="受注/入金待ち" value={stats.won} color="text-blue-600" />
          <SummaryCard label="受講中" value={stats.active} color="text-green-600" />
          {stats.totalRemaining > 0 && (
            <div className="bg-white rounded-lg border px-4 py-2 flex items-center gap-2">
              <span className="text-xs text-muted-foreground">未回収残金</span>
              <Badge variant="destructive">
                ¥{stats.totalRemaining.toLocaleString()}
              </Badge>
            </div>
          )}
        </div>

        {/* カンバンボード */}
        <KanbanBoard />

        {/* 操作ログ */}
        <ActivityLogPanel />
      </div>

      {/* 顧客詳細シート */}
      <ClientDetailSheet />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-white rounded-lg border px-4 py-2 flex items-center gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-lg font-bold ${color}`}>{value}</span>
    </div>
  );
}
