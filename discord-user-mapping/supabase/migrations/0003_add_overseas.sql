-- =====================================================================
-- Migration 0003: 海外（都道府県以外）に対応
-- 追加カラム:
--   is_overseas    boolean 必須（既定 false）… 海外・その他フラグ
--   overseas_label text    任意 … 国・地域名（例「アメリカ」「USA」）
--
-- 海外ユーザーは prefecture_code = null / is_overseas = true で保存する。
-- Supabase の SQL Editor に貼り付けて実行してください（既存行も安全）。
-- =====================================================================

alter table public.profiles
  add column if not exists is_overseas    boolean not null default false,
  add column if not exists overseas_label text;

create index if not exists profiles_is_overseas_idx on public.profiles (is_overseas);
