"use client";

import { usePipelineStore } from "@/lib/store";
import { ACTION_LABELS } from "@/types/pipeline";
import { Badge } from "@/components/ui/badge";
import { Clock, UserPlus, Trophy, XCircle, ArrowRight, Trash2, CheckCircle2 } from "lucide-react";

const ACTION_ICONS: Record<string, typeof Clock> = {
  created: UserPlus,
  won: Trophy,
  lost: XCircle,
  handed_over: ArrowRight,
  onboarding: ArrowRight,
  active: CheckCircle2,
  deleted: Trash2,
  chatwork_connected: CheckCircle2,
  membership_invited: CheckCircle2,
  utage_issued: CheckCircle2,
};

const ACTION_COLORS: Record<string, string> = {
  created: "text-blue-600",
  won: "text-green-600",
  lost: "text-red-500",
  handed_over: "text-amber-600",
  onboarding: "text-purple-600",
  active: "text-green-700",
  deleted: "text-red-600",
  chatwork_connected: "text-teal-600",
  membership_invited: "text-teal-600",
  utage_issued: "text-teal-600",
};

export function ActivityLogPanel() {
  const activityLogs = usePipelineStore((s) => s.activityLogs);

  if (activityLogs.length === 0) return null;

  return (
    <div className="mt-6 bg-white rounded-lg border">
      <div className="px-4 py-3 border-b flex items-center gap-2">
        <Clock className="w-4 h-4 text-muted-foreground" />
        <h3 className="font-semibold text-sm">操作ログ</h3>
        <Badge variant="secondary" className="text-xs">
          {activityLogs.length}
        </Badge>
      </div>
      <div className="divide-y max-h-[300px] overflow-y-auto">
        {activityLogs.map((log) => {
          const Icon = ACTION_ICONS[log.action] ?? Clock;
          const color = ACTION_COLORS[log.action] ?? "text-gray-500";
          const label = ACTION_LABELS[log.action] ?? log.action;

          return (
            <div key={log.id} className="px-4 py-2.5 flex items-center gap-3 text-sm">
              <Icon className={`w-4 h-4 shrink-0 ${color}`} />
              <div className="flex-1 min-w-0">
                <span className="font-medium">{log.client_name}</span>
                <span className="text-muted-foreground"> - </span>
                <span className={color}>{label}</span>
                {log.detail && (
                  <span className="text-muted-foreground text-xs ml-1">
                    ({log.detail})
                  </span>
                )}
              </div>
              <time className="text-xs text-muted-foreground shrink-0">
                {new Date(log.created_at).toLocaleString("ja-JP", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </time>
            </div>
          );
        })}
      </div>
    </div>
  );
}
