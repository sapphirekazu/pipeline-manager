import { create } from "zustand";
import {
  Client,
  SalesPipeline,
  PipelineStatus,
  PaymentType,
} from "@/types/pipeline";
import { mockClients, mockPipelines } from "@/lib/mock-data";
import * as api from "@/lib/api";

interface PipelineStore {
  clients: Client[];
  pipelines: SalesPipeline[];
  selectedPipelineId: string | null;
  loading: boolean;
  error: string | null;

  // データ取得
  fetchData: () => Promise<void>;

  // アクション
  selectPipeline: (id: string | null) => void;
  addClient: (data: {
    name: string;
    email: string;
    phone?: string;
    notes?: string;
  }) => Promise<void>;
  updatePipelineField: (
    id: string,
    updates: Partial<SalesPipeline>
  ) => Promise<void>;
  setDealResult: (
    id: string,
    result: "won" | "lost",
    paymentInfo?: {
      payment_type: PaymentType;
      total_amount: number;
      paid_amount: number;
    }
  ) => Promise<void>;
  advanceToHandedOver: (id: string) => Promise<void>;
  advanceToActive: (id: string) => Promise<void>;
  deletePipeline: (id: string) => Promise<void>;
}

export const usePipelineStore = create<PipelineStore>((set, get) => ({
  clients: api.isSupabaseConfigured() ? [] : mockClients,
  pipelines: api.isSupabaseConfigured() ? [] : mockPipelines,
  selectedPipelineId: null,
  loading: false,
  error: null,

  fetchData: async () => {
    if (!api.isSupabaseConfigured()) return;
    set({ loading: true, error: null });
    try {
      const data = await api.fetchPipelinesWithClients();
      const clients = data.map((d) => d.client);
      const uniqueClients = Array.from(
        new Map(clients.map((c) => [c.id, c])).values()
      );
      set({ pipelines: data, clients: uniqueClients, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  selectPipeline: (id) => set({ selectedPipelineId: id }),

  addClient: async (data) => {
    if (!api.isSupabaseConfigured()) {
      // モックモード
      const clientId = `c${Date.now()}`;
      const pipelineId = `p${Date.now()}`;
      const now = new Date().toISOString();
      const newClient: Client = {
        id: clientId,
        ...data,
        created_at: now,
        updated_at: now,
      };
      const newPipeline: SalesPipeline = {
        id: pipelineId,
        client_id: clientId,
        status: "lead",
        total_amount: 0,
        paid_amount: 0,
        remaining_amount: 0,
        is_chatwork_connected: false,
        is_membership_invited: false,
        is_utage_account_issued: false,
        created_at: now,
        updated_at: now,
      };
      set((state) => ({
        clients: [...state.clients, newClient],
        pipelines: [...state.pipelines, newPipeline],
      }));
      return;
    }

    try {
      const { client, pipeline } = await api.createClientWithPipeline(data);
      set((state) => ({
        clients: [...state.clients, client],
        pipelines: [...state.pipelines, { ...pipeline, client }],
      }));
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  updatePipelineField: async (id, updates) => {
    // 楽観的更新
    set((state) => ({
      pipelines: state.pipelines.map((p) =>
        p.id === id
          ? { ...p, ...updates, updated_at: new Date().toISOString() }
          : p
      ),
    }));

    if (api.isSupabaseConfigured()) {
      try {
        await api.updatePipelineFields(id, updates);
      } catch (e) {
        set({ error: (e as Error).message });
        get().fetchData(); // ロールバック
      }
    }
  },

  setDealResult: async (id, result, paymentInfo) => {
    const now = new Date().toISOString();

    // 楽観的更新
    set((state) => ({
      pipelines: state.pipelines.map((p) => {
        if (p.id !== id) return p;
        if (result === "lost") {
          return { ...p, status: "lost" as const, updated_at: now };
        }
        return {
          ...p,
          status: "won" as const,
          payment_type: paymentInfo?.payment_type,
          total_amount: paymentInfo?.total_amount ?? 0,
          paid_amount: paymentInfo?.paid_amount ?? 0,
          remaining_amount:
            (paymentInfo?.total_amount ?? 0) - (paymentInfo?.paid_amount ?? 0),
          won_at: now,
          updated_at: now,
        };
      }),
    }));

    if (api.isSupabaseConfigured()) {
      try {
        await api.setDealResult(id, result, paymentInfo);
      } catch (e) {
        set({ error: (e as Error).message });
        get().fetchData();
      }
    }
  },

  advanceToHandedOver: async (id) => {
    const now = new Date().toISOString();
    set((state) => ({
      pipelines: state.pipelines.map((p) =>
        p.id === id
          ? {
              ...p,
              status: "handed_over" as const,
              handed_over_at: now,
              updated_at: now,
            }
          : p
      ),
    }));

    if (api.isSupabaseConfigured()) {
      try {
        await api.advanceStatus(id, "handed_over", "handed_over_at");
      } catch (e) {
        set({ error: (e as Error).message });
        get().fetchData();
      }
    }
  },

  advanceToActive: async (id) => {
    const now = new Date().toISOString();
    set((state) => ({
      pipelines: state.pipelines.map((p) =>
        p.id === id
          ? {
              ...p,
              status: "active" as const,
              activated_at: now,
              updated_at: now,
            }
          : p
      ),
    }));

    if (api.isSupabaseConfigured()) {
      try {
        await api.advanceStatus(id, "active", "activated_at");
      } catch (e) {
        set({ error: (e as Error).message });
        get().fetchData();
      }
    }
  },

  deletePipeline: async (id) => {
    const pipeline = get().pipelines.find((p) => p.id === id);
    if (!pipeline) return;

    set((state) => ({
      pipelines: state.pipelines.filter((p) => p.id !== id),
      clients: state.clients.filter((c) => c.id !== pipeline.client_id),
      selectedPipelineId: null,
    }));

    if (api.isSupabaseConfigured()) {
      try {
        await api.deletePipeline(id, pipeline.client_id);
      } catch (e) {
        set({ error: (e as Error).message });
        get().fetchData();
      }
    }
  },
}));
