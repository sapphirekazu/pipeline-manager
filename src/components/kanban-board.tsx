"use client";

import { useState } from "react";
import { KANBAN_COLUMNS, PipelineStatus } from "@/types/pipeline";
import { usePipelineStore } from "@/lib/store";
import { ClientCard } from "@/components/client-card";
import { Badge } from "@/components/ui/badge";

export function KanbanBoard() {
  const pipelines = usePipelineStore((s) => s.pipelines);
  const clients = usePipelineStore((s) => s.clients);
  const changeStatus = usePipelineStore((s) => s.changeStatus);

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [hoverColumnId, setHoverColumnId] = useState<PipelineStatus | null>(null);

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    pipelineId: string
  ) => {
    setDraggingId(pipelineId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", pipelineId);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setHoverColumnId(null);
  };

  const handleDragOver = (
    e: React.DragEvent<HTMLDivElement>,
    columnId: PipelineStatus
  ) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (hoverColumnId !== columnId) setHoverColumnId(columnId);
  };

  const handleDragLeave = () => {
    setHoverColumnId(null);
  };

  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>,
    columnId: PipelineStatus
  ) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || draggingId;
    if (!id) return;
    const pipeline = pipelines.find((p) => p.id === id);
    if (pipeline && pipeline.status !== columnId) {
      changeStatus(id, columnId);
    }
    setDraggingId(null);
    setHoverColumnId(null);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 px-1">
      {KANBAN_COLUMNS.map((column) => {
        const columnPipelines = pipelines.filter(
          (p) => p.status === column.id
        );
        const isHover = hoverColumnId === column.id;
        return (
          <div
            key={column.id}
            className={`flex-shrink-0 w-72 rounded-lg border-2 transition-all ${
              column.color
            } ${isHover ? "ring-2 ring-blue-500 ring-offset-2 scale-[1.01]" : ""}`}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.id)}
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
                  ここにドロップ
                </div>
              ) : (
                columnPipelines.map((pipeline) => {
                  const client = clients.find(
                    (c) => c.id === pipeline.client_id
                  );
                  if (!client) return null;
                  return (
                    <div
                      key={pipeline.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, pipeline.id)}
                      onDragEnd={handleDragEnd}
                      className={`transition-opacity ${
                        draggingId === pipeline.id ? "opacity-40" : ""
                      }`}
                    >
                      <ClientCard pipeline={pipeline} client={client} />
                    </div>
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
