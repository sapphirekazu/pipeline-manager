"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Client, SalesPipeline, PAYMENT_TYPE_LABELS } from "@/types/pipeline";
import { usePipelineStore } from "@/lib/store";
import { Mail, Phone, AlertTriangle, CheckCircle2 } from "lucide-react";

interface ClientCardProps {
  pipeline: SalesPipeline;
  client: Client;
}

export function ClientCard({ pipeline, client }: ClientCardProps) {
  const selectPipeline = usePipelineStore((s) => s.selectPipeline);

  const hasRemaining = pipeline.remaining_amount > 0;

  return (
    <Card
      className="p-3 cursor-pointer hover:shadow-md transition-shadow border-l-4"
      style={{
        borderLeftColor: hasRemaining ? "#f59e0b" : "#10b981",
      }}
      onClick={() => selectPipeline(pipeline.id)}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-sm truncate">{client.name}</h4>
          {pipeline.sales_rep && (
            <Badge variant="outline" className="text-xs shrink-0 ml-1">
              {pipeline.sales_rep}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Mail className="w-3 h-3" />
          <span className="truncate">{client.email}</span>
        </div>

        {client.phone && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Phone className="w-3 h-3" />
            <span>{client.phone}</span>
          </div>
        )}

        {pipeline.payment_type && (
          <div className="flex items-center gap-1">
            <Badge
              variant={hasRemaining ? "destructive" : "secondary"}
              className="text-xs"
            >
              {PAYMENT_TYPE_LABELS[pipeline.payment_type]}
            </Badge>
            {hasRemaining && (
              <span className="text-xs text-amber-600 font-medium flex items-center gap-0.5">
                <AlertTriangle className="w-3 h-3" />
                残金 ¥{pipeline.remaining_amount.toLocaleString()}
              </span>
            )}
          </div>
        )}

        {/* チェックリスト進捗 */}
        <div className="flex gap-1.5 pt-1">
          <CheckItem
            done={pipeline.is_chatwork_connected}
            label="CW接続"
          />
          <CheckItem
            done={pipeline.is_membership_invited}
            label="会員招待"
          />
          <CheckItem
            done={pipeline.is_utage_account_issued}
            label="Utage"
          />
        </div>
      </div>
    </Card>
  );
}

function CheckItem({ done, label }: { done: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs rounded-full px-1.5 py-0.5 ${
        done
          ? "bg-green-100 text-green-700"
          : "bg-gray-100 text-gray-400"
      }`}
    >
      <CheckCircle2 className="w-3 h-3" />
      {label}
    </span>
  );
}
