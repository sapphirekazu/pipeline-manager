-- ============================================
-- あっと夫婦 講座管理パイプライン - Supabaseスキーマ
-- ============================================

-- ステータスENUM型
CREATE TYPE pipeline_status AS ENUM (
  'lead',        -- 相談前（個別相談申し込み済み）
  'won',         -- 受注（商談成立・入金待ち含む）
  'lost',        -- 失注
  'handed_over', -- あっと夫婦へ引き継ぎ済み
  'onboarding',  -- Utage等設定中（運営フェーズ）
  'active'       -- 受講開始（全設定完了）
);

-- 支払い方法ENUM型
CREATE TYPE payment_type AS ENUM (
  'bank_transfer',  -- 銀行一括支払い
  'credit_card',    -- クレジット支払い
  'partial'         -- 頭金のみ支払い（残金あり）
);

-- ============================================
-- 顧客テーブル
-- ============================================
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 営業パイプラインテーブル
-- ============================================
CREATE TABLE sales_pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  -- ステータス管理
  status pipeline_status NOT NULL DEFAULT 'lead',

  -- ======= Phase 1: 営業フェーズ =======
  -- 商談日時
  consultation_date TIMESTAMPTZ,

  -- 支払い情報（受注時のみ）
  payment_type payment_type,
  total_amount INTEGER DEFAULT 0,       -- 総額（円）
  paid_amount INTEGER DEFAULT 0,        -- 支払済み金額（円）
  remaining_amount INTEGER DEFAULT 0,   -- 残金（円）
  payment_notes TEXT,                    -- 支払いメモ（分割予定等）

  -- 営業チェックリスト
  is_chatwork_connected BOOLEAN NOT NULL DEFAULT false,  -- Chatwork接続完了

  -- ======= Phase 2: 運営フェーズ =======
  -- 運営チェックリスト
  is_membership_invited BOOLEAN NOT NULL DEFAULT false,   -- 会員専用グループ・サイト招待完了
  is_utage_account_issued BOOLEAN NOT NULL DEFAULT false, -- Utageアカウント発行完了

  -- 営業担当者名（将来の拡張用）
  sales_rep TEXT,

  -- タイムスタンプ
  won_at TIMESTAMPTZ,         -- 受注日
  handed_over_at TIMESTAMPTZ, -- 引き継ぎ日
  activated_at TIMESTAMPTZ,   -- 受講開始日
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 入金履歴テーブル（分割払いトラッキング用）
-- ============================================
CREATE TABLE payment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID NOT NULL REFERENCES sales_pipelines(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,            -- 入金額（円）
  payment_date DATE NOT NULL,         -- 入金日
  method TEXT,                        -- 入金手段メモ
  notes TEXT,                         -- 備考
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- インデックス
-- ============================================
CREATE INDEX idx_pipelines_status ON sales_pipelines(status);
CREATE INDEX idx_pipelines_client ON sales_pipelines(client_id);
CREATE INDEX idx_payment_records_pipeline ON payment_records(pipeline_id);

-- ============================================
-- updated_at 自動更新トリガー
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_pipelines_updated_at
  BEFORE UPDATE ON sales_pipelines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
