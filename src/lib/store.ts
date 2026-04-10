import { create } from "zustand";
import {
  Client,
  SalesPipeline,
  PipelineStatus,
  PaymentType,
  ActivityLog,
} from "@/types/pipeline";
import { mockClients, mockPipelines } from "@/lib/mock-data";
import * as api from "@/lib/api";

interface PipelineStore {
  clients: Client[];
  pipelines: SalesPipeline[];
  activityLogs: ActivityLog[];
  selectedPipelineId: string | null;
  loading: boolean;
  error: string | null;

  fetchData: () => Promise<void>;
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
  updateClientInfo: (
    clientId: string,
    updates: Partial<Pick<Client, "name" | "email" | "phone" | "notes">>
  ) => Promise<void>;
  updatePayment: (
    id: string,
    payment: {
      payment_type?: PaymentType;
      total_amount?: number;
      paid_amount?: number;
      payment_notes?: string;
    }
  ) => Promise<void>;
  changeStatus: (id: string, newStatus: PipelineStatus) => Promise<void>;
}

function getClientName(state: PipelineStore, pipelineId: string): string {
  const pipeline = state.pipelines.find((p) => p.id === pipelineId);
  if (!pipeline) return "不明";
  const client = state.clients.find((c) => c.id === pipeline.client_id);
  return client?.name ?? "不明";
}

export const usePipelineStore = create<PipelineStore>((set, get) => ({
  clients: api.isSupabaseConfigured() ? [] : mockClients,
  pipelines: api.isSupabaseConfigured() ? [] : mockPipelines,
  activityLogs: [],
  selectedPipelineId: null,
  loading: false,
  error: null,

  fetchData: async () => {
    if (!api.isSupabaseConfigured()) return;
    set({ loading: true, error: null });
    try {
      const [data, logs] = await Promise.all([
        api.fetchPipelinesWithClients(),
        api.fetchActivityLogs(),
      ]);
      const clients = data.map((d) => d.client);
      const uniqueClients = Array.from(
        new Map(clients.map((c) => [c.id, c])).values()
      );
      set({ pipelines: data, clients: uniqueClients, activityLogs: logs, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  selectPipeline: (id) => set({ selectedPipelineId: id }),

  addClient: async (data) => {
    if (!api.isSupabaseConfigured()) {
      const clientId = `c${Date.now()}`;
      const pipelineId = `p${Date.now()}`;
      const now = new Date().toISOString();
      const newClient: Client = { id: clientId, ...data, created_at: now, updated_at: now };
      const newPipeline: SalesPipeline = {
        id: pipelineId, client_id: clientId, status: "lead",
        total_amount: 0, paid_amount: 0, remaining_amount: 0,
        is_chatwork_connected: false, is_membership_invited: false, is_utage_account_issued: false,
        created_at: now, updated_at: now,
      };
      set((state) => ({
        clients: [...state.clients, newClient],
        pipelines: [...state.pipelines, newPipeline],
        activityLogs: [{ id: `l${Date.now()}`, client_name: data.name, action: "created", created_at: now }, ...state.activityLogs],
      }));
      return;
    }

    try {
      const { client, pipeline } = await api.createClientWithPipeline(data);
      set((state) => ({
        clients: [...state.clients, client],
        pipelines: [...state.pipelines, { ...pipeline, client }],
      }));
      get().fetchData(); // ログも含めて再取得
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  updatePipelineField: async (id, updates) => {
    const clientName = getClientName(get(), id);
    set((state) => ({
      pipelines: state.pipelines.map((p) =>
        p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p
      ),
    }));

    if (api.isSupabaseConfigured()) {
      try {
        await api.updatePipelineFields(id, clientName, updates);
        get().fetchData();
      } catch (e) {
        set({ error: (e as Error).message });
        get().fetchData();
      }
    }
  },

  setDealResult: async (id, result, paymentInfo) => {
    const clientName = getClientName(get(), id);
    const now = new Date().toISOString();

    set((state) => ({
      pipelines: state.pipelines.map((p) => {
        if (p.id !== id) return p;
        if (result === "lost") return { ...p, status: "lost" as const, updated_at: now };
        return {
          ...p, status: "won" as const,
          payment_type: paymentInfo?.payment_type,
          total_amount: paymentInfo?.total_amount ?? 0,
          paid_amount: paymentInfo?.paid_amount ?? 0,
          remaining_amount: (paymentInfo?.total_amount ?? 0) - (paymentInfo?.paid_amount ?? 0),
          won_at: now, updated_at: now,
        };
      }),
    }));

    if (api.isSupabaseConfigured()) {
      try {
        await api.setDealResult(id, clientName, result, paymentInfo);
        get().fetchData();
      } catch (e) {
        set({ error: (e as Error).message });
        get().fetchData();
      }
    }
  },

  advanceToHandedOver: async (id) => {
    const clientName = getClientName(get(), id);
    const now = new Date().toISOString();
    set((state) => ({
      pipelines: state.pipelines.map((p) =>
        p.id === id ? { ...p, status: "handed_over" as const, handed_over_at: now, updated_at: now } : p
      ),
    }));

    if (api.isSupabaseConfigured()) {
      try {
        await api.advanceStatus(id, clientName, "handed_over", "handed_over_at");
        get().fetchData();
      } catch (e) {
        set({ error: (e as Error).message });
        get().fetchData();
      }
    }
  },

  advanceToActive: async (id) => {
    const clientName = getClientName(get(), id);
    const now = new Date().toISOString();
    set((state) => ({
      pipelines: state.pipelines.map((p) =>
        p.id === id ? { ...p, status: "active" as const, activated_at: now, updated_at: now } : p
      ),
    }));

    if (api.isSupabaseConfigured()) {
      try {
        await api.advanceStatus(id, clientName, "active", "activated_at");
        get().fetchData();
      } catch (e) {
        set({ error: (e as Error).message });
        get().fetchData();
      }
    }
  },

  updateClientInfo: async (clientId, updates) => {
    const oldClient = get().clients.find((c) => c.id === clientId);
    if (!oldClient) return;

    set((state) => ({
      clients: state.clients.map((c) =>
        c.id === clientId ? { ...c, ...updates, updated_at: new Date().toISOString() } : c
      ),
    }));

    if (api.isSupabaseConfigured()) {
      try {
        await api.updateClient(clientId, oldClient.name, updates);
        get().fetchData();
      } catch (e) {
        set({ error: (e as Error).message });
        get().fetchData();
      }
    }
  },

  updatePayment: async (id, payment) => {
    const clientName = getClientName(get(), id);
    const total = payment.total_amount ?? 0;
    const paid = payment.paid_amount ?? 0;

    set((state) => ({
      pipelines: state.pipelines.map((p) =>
        p.id === id
          ? {
              ...p,
              payment_type: payment.payment_type,
              total_amount: total,
              paid_amount: paid,
              remaining_amount: total - paid,
              payment_notes: payment.payment_notes,
              updated_at: new Date().toISOString(),
            }
          : p
      ),
    }));

    if (api.isSupabaseConfigured()) {
      try {
        await api.updatePayment(id, clientName, payment);
        get().fetchData();
      } catch (e) {
        set({ error: (e as Error).message });
        get().fetchData();
      }
    }
  },

  changeStatus: async (id, newStatus) => {
    const clientName = getClientName(get(), id);
    const now = new Date().toISOString();

    set((state) => ({
      pipelines: state.pipelines.map((p) => {
        if (p.id !== id) return p;
        const updates: Partial<SalesPipeline> = { status: newStatus, updated_at: now };
        if (newStatus === "won" && !p.won_at) updates.won_at = now;
        if (newStatus === "handed_over" && !p.handed_over_at) updates.handed_over_at = now;
        if (newStatus === "active" && !p.activated_at) updates.activated_at = now;
        return { ...p, ...updates };
      }),
    }));

    if (api.isSupabaseConfigured()) {
      try {
        await api.changeStatus(id, clientName, newStatus);
        get().fetchData();
      } catch (e) {
        set({ error: (e as Error).message });
        get().fetchData();
      }
    }
  },

  deletePipeline: async (id) => {
    const pipeline = get().pipelines.find((p) => p.id === id);
    if (!pipeline) return;
    const clientName = getClientName(get(), id);

    set((state) => ({
      pipelines: state.pipelines.filter((p) => p.id !== id),
      clients: state.clients.filter((c) => c.id !== pipeline.client_id),
      selectedPipelineId: null,
      activityLogs: [{ id: `l${Date.now()}`, client_name: clientName, action: "deleted", created_at: new Date().toISOString() }, ...state.activityLogs],
    }));

    if (api.isSupabaseConfigured()) {
      try {
        await api.deletePipeline(id, pipeline.client_id, clientName);
        get().fetchData();
      } catch (e) {
        set({ error: (e as Error).message });
        get().fetchData();
      }
    }
  },
}));
