"use client";

import { KANBAN_COLUMNS } from "@/types/pipeline";
import { usePipelineStore } from "@/lib/store";
import { ClientCard } from "@/components/client-card";
import { Badge } from "@/components/ui/badge";

export function KanbanBoard() {
  const pipelines = usePipelineStore((s) => s.pipelines);
  const clients = usePipelineStore((s) => s.clients);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 px-1">
      {KANBAN_COLUMNS.map((column) => {
        const columnPipelines = pipelines.filter(
          (p) => p.status === column.id
        );
        return (
          <div
            key={column.id}
            className={`flex-shrink-0 w-72 rounded-lg border-2 ${column.color}`}
          >
            {/* カラムヘッダー */}
            <div className="p-3 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm">{column.label}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {columnPipelines.length}
                  </Badge>
                </div>
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    column.phase === "sales"
                      ? "border-blue-400 text-blue-600"
                      : "border-purple-400 text-purple-600"
                  }`}
                >
                  {column.phase === "sales" ? "営業" : "運営"}
                </Badge>
              </div>
            </div>

            {/* カード一覧 */}
            <div className="p-2 space-y-2 min-h-[200px] max-h-[calc(100vh-240px)] overflow-y-auto">
              {columnPipelines.length === 0 ? (
                <div className="text-center text-xs text-muted-foreground py-8">
                  該当なし
                </div>
              ) : (
                columnPipelines.map((pipeline) => {
                  const client = clients.find(
                    (c) => c.id === pipeline.client_id
                  );
                  if (!client) return null;
                  return (
                    <ClientCard
                      key={pipeline.id}
                      pipeline={pipeline}
                      client={client}
                    />
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
